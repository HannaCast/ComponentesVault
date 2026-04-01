from django.db import transaction
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from classrooms.models import Classrooms
from classrooms.serializers import (
    ClassroomDetailSerializer,
    ClassroomListSerializer,
    ClassroomSelectSerializer,
    ClassroomWriteSerializer,
)
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Classrooms'])
class ClassroomListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        selected_university_id = request.selected_university_id

        queryset = Classrooms.objects.filter(
            status=1,
            is_deleted=0,
            universities_id=selected_university_id,
        ).select_related('classroom_type').order_by('name', 'id')

        return ApiResponse.success(
            ClassroomSelectSerializer(queryset, many=True).data
        )

    @extend_schema(request=ClassroomWriteSerializer)
    @transaction.atomic
    def post(self, request):
        selected_university_id = request.selected_university_id

        serializer = ClassroomWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(
                ClassroomDetailSerializer(row).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Classrooms'])
class ClassroomPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {
        'id',
        'name',
        'code',
        'building',
        'building_code',
        'is_restricted',
        'status',
    }

    @extend_schema(
        summary='Lista paginada de aulas',
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
                description='Texto de búsqueda (name, code, building, building_code)',
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filtro por estado: true/false (sin valor: todos)',
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Campo de ordenamiento: id, name, code, building, building_code, '
                    'is_restricted, status (por defecto: id)'
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

        queryset = Classrooms.objects.filter(
            is_deleted=0,
            universities_id=selected_university_id,
        ).select_related('classroom_type')

        if status_param is not None:
            queryset = queryset.filter(
                status=1 if status_param.lower() == 'true' else 0
            )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(building__icontains=search)
                | Q(building_code__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        rows = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=ClassroomListSerializer(rows, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Classrooms'])
class ClassroomDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return Classrooms.objects.select_related('classroom_type').get(
                pk=pk,
                is_deleted=0,
                universities_id=university_id,
            )
        except Classrooms.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ClassroomDetailSerializer(row).data)

    @extend_schema(request=ClassroomWriteSerializer)
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = ClassroomWriteSerializer(row, data=request.data, partial=True)
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                ClassroomDetailSerializer(row).data,
                message='Aula actualizada correctamente',
            )
        return ApiResponse.error(errors=serializer.errors)

    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()

        return ApiResponse.deleted('Aula eliminada correctamente')


@extend_schema(tags=['Classrooms'])
class ClassroomToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @transaction.atomic
    def put(self, request, pk):
        try:
            row = Classrooms.objects.get(
                pk=pk,
                is_deleted=0,
                universities_id=request.selected_university_id,
            )
        except Classrooms.DoesNotExist:
            return ApiResponse.not_found()

        row.status = 0 if row.status == 1 else 1
        row.save()

        estado = 'activada' if row.status == 1 else 'desactivada'
        return ApiResponse.success(
            data=ClassroomDetailSerializer(row).data,
            message=f'Aula {estado} correctamente',
        )

