from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from subjects.models import Subjects
from subjects.serializers.subjects import SubjectWriteSerializer, SubjectDetailSerializer, SubjectListSerializer, SubjectSelectSerializer

@extend_schema(tags=['Subjects'])
class SubjectListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        """ Lista de materias activas (para selects) """
        selected_university_id = request.selected_university_id

        subjects = Subjects.objects.filter(
            status=1,
            is_deleted=0,
            university_id=selected_university_id,
        )
        return ApiResponse.success(
            SubjectSelectSerializer(subjects, many=True).data
        )

    @extend_schema(request=SubjectWriteSerializer)
    def post(self, request):
        """ Crear materia """
        selected_university_id = request.selected_university_id

        serializer = SubjectWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            subject = serializer.save()
            return ApiResponse.created(
                SubjectDetailSerializer(subject).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Subjects'])
class SubjectPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {'id', 'name', 'code', 'hours_per_week'}

    @extend_schema(
        summary='Lista paginada de materias',
        description='Retorna las materias de forma paginada con soporte de búsqueda, filtro por status y ordenamiento.',
        parameters=[
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Número de página (por defecto: 1)',
                default=1,
                ),
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Cantidad de resultados por página (por defecto: 10)',
                default=10,),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Texto de búsqueda',
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filtro por estado: true (activos) / false (inactivos). Sin valor: retorna todos los no eliminados.',
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Campo de ordenamiento: id, name, hex, contrast_hex (por defecto: id)',
                default='id',
                required=False,            ),
            OpenApiParameter(
                name='order',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Dirección de ordenamiento: ASC, DESC (por defecto: ASC)',
                enum=['ASC', 'DESC'],
                default='ASC',
                required=False,
            ),
        ],
    )
    def get(self, request):
        """ Lista paginada de materias con búsqueda, filtro por status y ordenamiento """
        selected_university_id = request.selected_university_id

        page = max(1, int(request.query_params.get('page', 1)))
        limit = max(1, int(request.query_params.get('limit', 10)))
        search = request.query_params.get('search', '').strip()
        status_param = request.query_params.get('status', None)
        sort_by = request.query_params.get('sortBy', 'id')
        order = request.query_params.get('order', 'ASC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'

        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = Subjects.objects.filter(
            is_deleted=0,
            university_id=selected_university_id,
        )

        if status_param is not None:
            queryset = queryset.filter(
                status=1 if status_param.lower() == 'true' else 0
            )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        subjects = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=SubjectListSerializer(subjects, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Subjects'])
class SubjectDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk):
        try:
            return Subjects.objects.get(pk=pk, is_deleted=0)
        except Subjects.DoesNotExist:
            return None

    def get(self, request, pk):
        subject = self.get_object(pk)
        if subject is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            SubjectDetailSerializer(subject).data
        )

    @extend_schema(request=SubjectWriteSerializer)
    def put(self, request, pk):
        subject = self.get_object(pk)
        if subject is None:
            return ApiResponse.not_found()

        serializer = SubjectWriteSerializer(
            subject, data=request.data, partial=True
        )

        if serializer.is_valid():
            subject = serializer.save()
            return ApiResponse.success(
                SubjectDetailSerializer(subject).data,
                message='Materia actualizada correctamente'
            )

        return ApiResponse.error(errors=serializer.errors)

    def delete(self, request, pk):
        subject = self.get_object(pk)
        if subject is None:
            return ApiResponse.not_found()

        subject.is_deleted = 1
        subject.save()

        return ApiResponse.deleted('Materia eliminada correctamente')


@extend_schema(tags=['Subjects'])
class SubjectToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def put(self, request, pk):
        try:
            subject = Subjects.objects.get(pk=pk, is_deleted=0)
        except Subjects.DoesNotExist:
            return ApiResponse.not_found()

        subject.status = 0 if subject.status == 1 else 1
        subject.save()

        estado = 'activada' if subject.status == 1 else 'desactivada'

        return ApiResponse.success(
            data=SubjectDetailSerializer(subject).data,
            message=f'Materia {estado} correctamente'
        )