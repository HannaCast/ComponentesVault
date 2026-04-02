from django.db.models import Q, TextField
from django.db.models.functions import Cast
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from audit.models import AuditLogs
from audit.serializers.audit import AuditLogDetailSerializer, AuditLogListSerializer
from core.api_response import ApiResponse
from core.permissions import IsAdmin, require_permissions


@extend_schema(tags=['Audit'])
class AuditLogPaginatedView(APIView):
    permission_classes = [IsAuthenticated]

    SORT_FIELDS = {
        'id',
        'created_at',
        'username',
        'table_name',
        'action',
        'source',
        'is_succesfull',
    }
    ACTION_FILTERS = frozenset({'CREATE', 'UPDATE', 'DELETE', 'INSERT', 'CHANGE_STATUS'})

    @extend_schema(
        summary='Lista paginada de bitacora',
        description=(
            'Retorna la bitacora de auditoria de forma paginada con soporte '
            'de busqueda, filtro por entidad, filtro por tipo de operacion '
            'y ordenamiento.'
        ),
        parameters=[
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Numero de pagina (por defecto: 1)',
                default=1,
            ),
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Cantidad de resultados por pagina (por defecto: 10)',
                default=10,
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Busqueda por usuario, accion, entidad o detalle',
                required=False,
            ),
            OpenApiParameter(
                name='entity',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filtro por entidad (table_name)',
                required=False,
            ),
            OpenApiParameter(
                name='action',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Filtro por accion de auditoria. '
                    'INSERT suele representar insercion desde aplicacion y '
                    'CREATE insercion directa en base de datos.'
                ),
                enum=['CREATE', 'UPDATE', 'DELETE', 'INSERT', 'CHANGE_STATUS'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Campo de ordenamiento',
                default='created_at',
                required=False,
            ),
            OpenApiParameter(
                name='order',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Direccion de ordenamiento: ASC, DESC (por defecto: DESC)',
                enum=['ASC', 'DESC'],
                default='DESC',
                required=False,
            ),
        ],
    )
    @require_permissions(IsAdmin)
    def get(self, request):
        """Lista paginada de auditoria con filtros de busqueda y entidad."""
        page_param = request.query_params.get('page', 1)
        limit_param = request.query_params.get('limit', 10)

        try:
            page = max(1, int(page_param))
        except (TypeError, ValueError):
            page = 1

        try:
            limit = max(1, int(limit_param))
        except (TypeError, ValueError):
            limit = 10

        search = request.query_params.get('search', '').strip()
        entity = request.query_params.get('entity', '').strip()
        action = request.query_params.get('action', '').strip().upper()
        sort_by = request.query_params.get('sortBy', 'created_at')
        order = request.query_params.get('order', 'DESC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'created_at'

        if order not in {'ASC', 'DESC'}:
            order = 'DESC'

        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = AuditLogs.objects.all()

        if entity and entity.lower() not in {'all', 'todas las entidades'}:
            queryset = queryset.filter(table_name__iexact=entity)

        if action and action not in {'ALL', 'TODAS LAS OPERACIONES'}:
            if action in self.ACTION_FILTERS:
                queryset = queryset.filter(action=action)

        if search:
            queryset = queryset.annotate(
                old_data_text=Cast('old_data', output_field=TextField()),
                new_data_text=Cast('new_data', output_field=TextField()),
            ).filter(
                Q(username__icontains=search)
                | Q(action__icontains=search)
                | Q(table_name__icontains=search)
                | Q(source__icontains=search)
                | Q(transaction_id__icontains=search)
                | Q(error_message__icontains=search)
                | Q(old_data_text__icontains=search)
                | Q(new_data_text__icontains=search)
            )

        queryset = queryset.order_by(order_field, '-id')
        total = queryset.count()
        audit_logs = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=AuditLogListSerializer(audit_logs, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Audit'])
class AuditLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return AuditLogs.objects.get(pk=pk)
        except AuditLogs.DoesNotExist:
            return None

    @extend_schema(summary='Detalle completo de bitacora')
    @require_permissions(IsAdmin)
    def get(self, request, pk):
        """Detalle completo de un registro de bitacora."""
        audit_log = self.get_object(pk)
        if audit_log is None:
            return ApiResponse.not_found()

        return ApiResponse.success(
            AuditLogDetailSerializer(audit_log).data
        )
