from django.db import transaction

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from universities.models.shifts import Shifts
from universities.serializers.shifts import (
    ShiftDetailSerializer,
    ShiftListSerializer,
    ShiftWriteSerializer,
)


@extend_schema(tags=['Shifts'])
class ShiftListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {
        'id',
        'name',
        'start_time',
        'end_time',
        'order',
    }

    @extend_schema(
        summary='Lista paginada de turnos',
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
        """Turnos activos de la universidad seleccionada."""
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

        from django.db.models import Q
        queryset = Shifts.objects.filter(
            status=1,
            is_deleted=0,
            university_id=selected_university_id,
        )

        if search:
            queryset = queryset.filter(Q(name__icontains=search))

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        rows = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=ShiftListSerializer(rows, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )

    @extend_schema(request=ShiftWriteSerializer)
    @with_audit_context(table_name='shifts')
    @transaction.atomic
    def post(self, request):
        """Crear turno."""
        selected_university_id = request.selected_university_id

        serializer = ShiftWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )

        if serializer.is_valid():
            shift = serializer.save()
            return ApiResponse.created(ShiftDetailSerializer(shift).data)

        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Shifts'])
class ShiftDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return Shifts.objects.select_related('university').get(
                pk=pk,
                is_deleted=0,
                university_id=university_id,
            )
        except Shifts.DoesNotExist:
            return None

    @extend_schema(responses=ShiftDetailSerializer, summary='Obtener turno')
    def get(self, request, pk):
        shift = self.get_object(pk, request.selected_university_id)
        if shift is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ShiftDetailSerializer(shift).data)

    @extend_schema(request=ShiftWriteSerializer)
    @with_audit_context(table_name='shifts')
    @transaction.atomic
    def put(self, request, pk):
        shift = self.get_object(pk, request.selected_university_id)
        if shift is None:
            return ApiResponse.not_found()

        serializer = ShiftWriteSerializer(
            shift,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            shift = serializer.save()
            return ApiResponse.success(
                ShiftDetailSerializer(shift).data,
                message='Turno actualizado correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='shifts')
    @transaction.atomic
    def delete(self, request, pk):
        shift = self.get_object(pk, request.selected_university_id)
        if shift is None:
            return ApiResponse.not_found()

        shift.is_deleted = 1
        shift.save()

        return ApiResponse.deleted('Turno eliminado correctamente')
