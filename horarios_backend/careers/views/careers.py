from django.db import transaction
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from careers.models import Careers
from careers.serializers.careers import ( CareerDetailSerializer, CareerWriteSerializer, CareerListSerializer, CareerSelectSerializer,)



@extend_schema(tags=['Careers'])
class CareerListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        """Lista de carreras activas (para selects)."""
        selected_university_id = request.selected_university_id

        careers = Careers.objects.filter(
            status=1,
            is_deleted=0,
            university_id=selected_university_id,
        )
        return ApiResponse.success(
            CareerSelectSerializer(careers, many=True).data
        )

    @extend_schema(request=CareerWriteSerializer)
    @transaction.atomic
    def post(self, request):
        """Crear carrera."""
        selected_university_id = request.selected_university_id

        serializer = CareerWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            career = serializer.save()
            return ApiResponse.created(
                CareerDetailSerializer(career).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Careers'])
class CareerPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {'id', 'name', 'code', 'total_periods', 'status'}

    @extend_schema(
        summary='Lista paginada de carreras',
        description=(
            'Retorna las carreras de forma paginada con búsqueda, '
            'filtro por status y ordenamiento.'
        ),
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
                description='Texto de búsqueda',
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Filtro por estado: true (activas) / false (inactivas). '
                    'Sin valor: retorna todas las no eliminadas.'
                ),
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Campo de ordenamiento: id, name, code, '
                    'total_periods, status (por defecto: id)'
                ),
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
        """Lista paginada de carreras."""
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

        queryset = Careers.objects.filter(
            is_deleted=0,
            university_id=selected_university_id,
        )

        if status_param is not None:
            queryset = queryset.filter(
                status=1 if status_param.lower() == 'true' else 0
            )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        careers = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=CareerListSerializer(careers, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Careers'])
class CareerDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return Careers.objects.get(
                pk=pk,
                is_deleted=0,
                university_id=university_id,
            )
        except Careers.DoesNotExist:
            return None

    def get(self, request, pk):
        career = self.get_object(pk, request.selected_university_id)
        if career is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            CareerDetailSerializer(career).data
        )

    @extend_schema(request=CareerWriteSerializer)
    @transaction.atomic
    def put(self, request, pk):
        career = self.get_object(pk, request.selected_university_id)
        if career is None:
            return ApiResponse.not_found()

        serializer = CareerWriteSerializer(
            career,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            career = serializer.save()
            return ApiResponse.success(
                CareerDetailSerializer(career).data,
                message='Carrera actualizada correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @transaction.atomic
    def delete(self, request, pk):
        career = self.get_object(pk, request.selected_university_id)
        if career is None:
            return ApiResponse.not_found()

        career.is_deleted = 1
        career.save()

        return ApiResponse.deleted('Carrera eliminada correctamente')


@extend_schema(tags=['Careers'])
class CareerToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @transaction.atomic
    def put(self, request, pk):
        try:
            career = Careers.objects.get(
                pk=pk,
                is_deleted=0,
                university_id=request.selected_university_id,
            )
        except Careers.DoesNotExist:
            return ApiResponse.not_found()

        career.status = 0 if career.status == 1 else 1
        career.save()

        estado = 'activada' if career.status == 1 else 'desactivada'

        return ApiResponse.success(
            data=CareerDetailSerializer(career).data,
            message=f'Carrera {estado} correctamente',
        )
