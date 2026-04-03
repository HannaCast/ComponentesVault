from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from core.audit_context import with_audit_action, with_audit_context
from core.api_response import ApiResponse
from teachers.models import Teachers
from teachers.serializers import TeacherWriteSerializer, TeacherDetailSerializer, TeacherListSerializer, TeacherSelectSerializer


@extend_schema(tags=['Teachers'])
class TeacherListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista los profesores activos y no eliminados (para selects/dropdowns)"""
        teachers = Teachers.objects.filter(status=1, is_deleted=0)
        return ApiResponse.success(TeacherSelectSerializer(teachers, many=True).data)

    @extend_schema(request=TeacherWriteSerializer)
    @with_audit_context(table_name='teachers')
    def post(self, request):
        """Crea un nuevo profesor"""
        serializer = TeacherWriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            teacher = serializer.save()
            return ApiResponse.created(TeacherDetailSerializer(teacher).data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Teachers'])
class TeacherPaginatedView(APIView):
    permission_classes = [IsAuthenticated]

    SORT_FIELDS = {'id', 'name', 'surname', 'last_name'}

    @extend_schema(
        summary='Lista paginada de profesores',
        description='Retorna los profesores de forma paginada con soporte de búsqueda, filtro por status y ordenamiento.',
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
                default=10,
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Término de búsqueda en nombre, apellido paterno (surname) o apellido materno (last_name)',
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
                description='Campo de ordenamiento: id, name, surname, last_name (por defecto: id)',
                default='id',
                required=False,
            ),
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
        """Lista paginada de profesores con búsqueda, filtro por status y ordenamiento"""
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

        queryset = Teachers.objects.filter(is_deleted=0)

        if status_param is not None:
            queryset = queryset.filter(status=1 if status_param.lower() == 'true' else 0)

        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(surname__icontains=search)
                | Q(last_name__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        teachers = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=TeacherListSerializer(teachers, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Teachers'])
class TeacherDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Busca un profesor no eliminado por su ID, retorna None si no existe o fue eliminado"""
        try:
            return Teachers.objects.get(pk=pk, is_deleted=0)
        except Teachers.DoesNotExist:
            return None

    def get(self, request, pk):
        """Obtiene un profesor por ID"""
        teacher = self.get_object(pk)
        if teacher is None:
            return ApiResponse.not_found()
        return ApiResponse.success(TeacherDetailSerializer(teacher).data)

    @extend_schema(request=TeacherWriteSerializer)
    @with_audit_context(table_name='teachers')
    def put(self, request, pk):
        """Actualiza uno o varios campos de un profesor (todos los campos son opcionales)"""
        teacher = self.get_object(pk)
        if teacher is None:
            return ApiResponse.not_found()
        serializer = TeacherWriteSerializer(
            teacher, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            teacher = serializer.save()
            return ApiResponse.success(TeacherDetailSerializer(teacher).data, message='Profesor actualizado exitosamente')
        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='teachers')
    def delete(self, request, pk):
        """Eliminación lógica: marca is_deleted = 1"""
        teacher = self.get_object(pk)
        if teacher is None:
            return ApiResponse.not_found()
        teacher.is_deleted = 1
        teacher.save()
        return ApiResponse.deleted('Profesor eliminado exitosamente')


@extend_schema(tags=['Teachers'])
class TeacherToggleStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @with_audit_context(table_name='teachers')
    def put(self, request, pk):
        """Alterna el status de un profesor entre activo (1) e inactivo (0)"""
        try:
            teacher = Teachers.objects.get(pk=pk, is_deleted=0)
        except Teachers.DoesNotExist:
            return ApiResponse.not_found()

        teacher.status = 0 if teacher.status == 1 else 1
        with with_audit_action('CHANGE_STATUS'):
            teacher.save()

        estado = 'activado' if teacher.status == 1 else 'desactivado'
        return ApiResponse.success(
            data=TeacherDetailSerializer(teacher).data,
            message=f'Profesor {estado} exitosamente',
        )
