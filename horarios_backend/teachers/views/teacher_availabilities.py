from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from core.audit_context import with_audit_action, with_audit_context
from core.api_response import ApiResponse
from teachers.models import TeacherAvailabilities
from teachers.serializers import (
    TeacherAvailabilityWriteSerializer,
    TeacherAvailabilityDetailSerializer,
    TeacherAvailabilityListSerializer,
)


@extend_schema(tags=['TeacherAvailabilities'])
class TeacherAvailabilityListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='teacher',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por ID de profesor (opcional)',
                required=False,
            ),
        ],
    )
    def get(self, request):
        """Lista disponibilidades no eliminadas; opcionalmente filtradas por profesor."""
        qs = TeacherAvailabilities.objects.filter(is_deleted=0).select_related('teacher')
        teacher_id = request.query_params.get('teacher')
        if teacher_id is not None and str(teacher_id).strip().isdigit():
            qs = qs.filter(teacher_id=int(teacher_id))
        rows = qs.order_by('teacher_id', 'day_of_week', 'start_time')
        return ApiResponse.success(TeacherAvailabilityListSerializer(rows, many=True).data)

    @extend_schema(request=TeacherAvailabilityWriteSerializer)
    @with_audit_context(table_name='teacher_availabilities')
    def post(self, request):
        """Crea un registro de disponibilidad."""
        serializer = TeacherAvailabilityWriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(TeacherAvailabilityDetailSerializer(row).data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['TeacherAvailabilities'])
class TeacherAvailabilityPaginatedView(APIView):
    permission_classes = [IsAuthenticated]

    SORT_FIELDS = {'id', 'teacher', 'day_of_week', 'start_time', 'end_time', 'is_available'}

    @extend_schema(
        summary='Lista paginada de disponibilidades',
        parameters=[
            OpenApiParameter(name='page', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, default=1),
            OpenApiParameter(name='limit', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, default=10),
            OpenApiParameter(
                name='teacher',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por ID de profesor',
                required=False,
            ),
            OpenApiParameter(
                name='day_of_week',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por día 1-7',
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='id, teacher, day_of_week, start_time, end_time, is_available',
                default='id',
                required=False,
            ),
            OpenApiParameter(
                name='order',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                enum=['ASC', 'DESC'],
                default='ASC',
                required=False,
            ),
        ],
    )
    def get(self, request):
        page = max(1, int(request.query_params.get('page', 1)))
        limit = max(1, int(request.query_params.get('limit', 10)))
        sort_by = request.query_params.get('sortBy', 'id')
        order = request.query_params.get('order', 'ASC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'
        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = TeacherAvailabilities.objects.filter(is_deleted=0).select_related('teacher')

        teacher_param = request.query_params.get('teacher')
        if teacher_param is not None and str(teacher_param).strip().isdigit():
            queryset = queryset.filter(teacher_id=int(teacher_param))

        day_param = request.query_params.get('day_of_week')
        if day_param is not None and str(day_param).strip().isdigit():
            queryset = queryset.filter(day_of_week=int(day_param))

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        rows = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=TeacherAvailabilityListSerializer(rows, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['TeacherAvailabilities'])
class TeacherAvailabilityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return TeacherAvailabilities.objects.select_related('teacher').get(pk=pk, is_deleted=0)
        except TeacherAvailabilities.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(TeacherAvailabilityDetailSerializer(row).data)

    @extend_schema(request=TeacherAvailabilityWriteSerializer)
    @with_audit_context(table_name='teacher_availabilities')
    def put(self, request, pk):
        row = self.get_object(pk)
        if row is None:
            return ApiResponse.not_found()
        serializer = TeacherAvailabilityWriteSerializer(
            row, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                TeacherAvailabilityDetailSerializer(row).data,
                message='Disponibilidad actualizada exitosamente',
            )
        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='teacher_availabilities')
    def delete(self, request, pk):
        row = self.get_object(pk)
        if row is None:
            return ApiResponse.not_found()
        row.is_deleted = 1
        row.save()
        return ApiResponse.deleted('Disponibilidad eliminada exitosamente')


@extend_schema(tags=['TeacherAvailabilities'])
class TeacherAvailabilityToggleView(APIView):
    permission_classes = [IsAuthenticated]

    @with_audit_context(table_name='teacher_availabilities')
    def put(self, request, pk):
        try:
            row = TeacherAvailabilities.objects.get(pk=pk, is_deleted=0)
        except TeacherAvailabilities.DoesNotExist:
            return ApiResponse.not_found()

        row.is_available = 0 if row.is_available == 1 else 1
        with with_audit_action('CHANGE_STATUS'):
            row.save()

        estado = 'disponible' if row.is_available == 1 else 'no disponible'
        return ApiResponse.success(
            data=TeacherAvailabilityDetailSerializer(row).data,
            message=f'Estado actualizado: {estado}',
        )
