from django.db import transaction
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from universities.models import AcademicPeriods
from universities.serializers.academic_periods import (
    AcademicPeriodDetailSerializer,
    AcademicPeriodListSerializer,
    AcademicPeriodWriteSerializer,
)


@extend_schema(tags=['Academic periods'])
class AcademicPeriodListCreateView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {
        'id',
        'name',
        'start_date',
        'end_date',
        'year',
        'order',
        'is_active',
    }

    @extend_schema(
        summary='Lista paginada de periodos académicos',
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
                description='Texto de búsqueda (por nombre)',
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Campo de ordenamiento (por defecto: id)',
                default='id',
                required=False,
            ),
            OpenApiParameter(
                name='order',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Dirección de ordenamiento: ASC, DESC (por defecto: DESC)',
                enum=['ASC', 'DESC'],
                default='DESC',
                required=False,
            ),
        ],
    )
    def get(self, request):
        selected_university_id = request.selected_university_id

        page = max(1, int(request.query_params.get('page', 1)))
        limit = max(1, int(request.query_params.get('limit', 10)))
        search = request.query_params.get('search', '').strip()
        sort_by = request.query_params.get('sortBy', 'id')
        order = request.query_params.get('order', 'DESC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'
        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = AcademicPeriods.objects.filter(
            is_deleted=0,
            university_id=selected_university_id,
        )

        if search:
            queryset = queryset.filter(Q(name__icontains=search))

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        rows = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=AcademicPeriodListSerializer(rows, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )

    @extend_schema(request=AcademicPeriodWriteSerializer)
    @transaction.atomic
    def post(self, request):
        selected_university_id = request.selected_university_id

        serializer = AcademicPeriodWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(AcademicPeriodDetailSerializer(row).data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Academic periods'])
class AcademicPeriodDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return AcademicPeriods.objects.get(
                pk=pk,
                is_deleted=0,
                university_id=university_id,
            )
        except AcademicPeriods.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(AcademicPeriodDetailSerializer(row).data)

    @extend_schema(request=AcademicPeriodWriteSerializer)
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = AcademicPeriodWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                AcademicPeriodDetailSerializer(row).data,
                message='Periodo académico actualizado correctamente',
            )
        return ApiResponse.error(errors=serializer.errors)

    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()
        return ApiResponse.deleted('Periodo académico eliminado correctamente')


@extend_schema(tags=['Academic periods'])
class AcademicPeriodToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @transaction.atomic
    def put(self, request, pk):
        try:
            row = AcademicPeriods.objects.get(
                pk=pk,
                is_deleted=0,
                university_id=request.selected_university_id,
            )
        except AcademicPeriods.DoesNotExist:
            return ApiResponse.not_found()

        # En academic_periods el "status" funcional es is_active
        row.is_active = 0 if int(row.is_active or 0) == 1 else 1
        row.save()

        if row.is_active == 1:
            AcademicPeriods.objects.filter(
                university_id=row.university_id,
                is_deleted=0,
            ).exclude(pk=row.pk).update(is_active=0)

        estado = 'activado' if row.is_active == 1 else 'desactivado'
        return ApiResponse.success(
            data=AcademicPeriodDetailSerializer(row).data,
            message=f'Periodo académico {estado} correctamente',
        )

