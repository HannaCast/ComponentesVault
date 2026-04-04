from django.db import transaction

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from careers.models.groups import Groups
from careers.serializers.groups import (
    GroupDetailSerializer,
    GroupListSerializer,
    GroupWriteSerializer,
)
from core.audit_context import with_audit_action, with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Groups'])
class GroupListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        responses=GroupListSerializer(many=True),
        summary='Listar grupos',
    )
    def get(self, request):
        """Lista de grupos activos de la universidad seleccionada (p. ej. selects)."""
        selected_university_id = request.selected_university_id

        groups = (
            Groups.objects.filter(
                status=1,
                is_deleted=0,
                university_id=selected_university_id,
            )
            .select_related('career', 'shift')
            .order_by('career_id', 'period_number', 'letter', 'id')
        )

        return ApiResponse.success(
            GroupListSerializer(groups, many=True).data
        )

    @extend_schema(request=GroupWriteSerializer)
    @with_audit_context(table_name='groups')
    @transaction.atomic
    def post(self, request):
        """Crear grupo."""
        selected_university_id = request.selected_university_id

        serializer = GroupWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )

        if serializer.is_valid():
            group = serializer.save()
            return ApiResponse.created(GroupDetailSerializer(group).data)

        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Groups'])
class GroupPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {'id', 'name', 'period_number', 'letter', 'status', 'career_id'}

    @extend_schema(
        summary='Lista paginada de grupos',
        description=(
            'Retorna los grupos de forma paginada con búsqueda por nombre, '
            'filtro por carrera y estado, y ordenamiento.'
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
                description='Búsqueda por nombre del grupo',
                required=False,
            ),
            OpenApiParameter(
                name='career_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por id de carrera',
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Filtro por estado: true (activos) / false (inactivos). '
                    'Sin valor: retorna todos los no eliminados.'
                ),
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Campo de ordenamiento: id, name, period_number, letter, '
                    'status, career_id (por defecto: id)'
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
        """Lista paginada de grupos."""
        selected_university_id = request.selected_university_id

        page = max(1, int(request.query_params.get('page', 1)))
        limit = max(1, int(request.query_params.get('limit', 10)))
        search = request.query_params.get('search', '').strip()
        status_param = request.query_params.get('status', None)
        career_id_param = request.query_params.get('career_id', None)
        sort_by = request.query_params.get('sortBy', 'id')
        order = request.query_params.get('order', 'ASC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'

        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = Groups.objects.filter(
            is_deleted=0,
            university_id=selected_university_id,
        ).select_related('career', 'shift')

        if status_param is not None:
            queryset = queryset.filter(
                status=1 if status_param.lower() == 'true' else 0
            )

        if career_id_param is not None:
            try:
                queryset = queryset.filter(career_id=int(career_id_param))
            except (TypeError, ValueError):
                pass

        if search:
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        groups = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=GroupListSerializer(groups, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Groups'])
class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return Groups.objects.select_related(
                'career',
                'shift',
                'academic_period',
                'university',
            ).get(
                pk=pk,
                is_deleted=0,
                university_id=university_id,
            )
        except Groups.DoesNotExist:
            return None

    @extend_schema(responses=GroupDetailSerializer, summary='Obtener grupo')
    def get(self, request, pk):
        group = self.get_object(pk, request.selected_university_id)
        if group is None:
            return ApiResponse.not_found()
        return ApiResponse.success(GroupDetailSerializer(group).data)

    @extend_schema(request=GroupWriteSerializer)
    @with_audit_context(table_name='groups')
    @transaction.atomic
    def put(self, request, pk):
        group = self.get_object(pk, request.selected_university_id)
        if group is None:
            return ApiResponse.not_found()

        serializer = GroupWriteSerializer(
            group,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            group = serializer.save()
            return ApiResponse.success(
                GroupDetailSerializer(group).data,
                message='Grupo actualizado correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='groups')
    @transaction.atomic
    def delete(self, request, pk):
        group = self.get_object(pk, request.selected_university_id)
        if group is None:
            return ApiResponse.not_found()

        group.is_deleted = 1
        group.save()

        return ApiResponse.deleted('Grupo eliminado correctamente')


@extend_schema(tags=['Groups'])
class GroupToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @with_audit_context(table_name='groups')
    @transaction.atomic
    def put(self, request, pk):
        try:
            group = Groups.objects.select_related(
                'career',
                'shift',
                'academic_period',
                'university',
            ).get(
                pk=pk,
                is_deleted=0,
                university_id=request.selected_university_id,
            )
        except Groups.DoesNotExist:
            return ApiResponse.not_found()

        group.status = 0 if group.status == 1 else 1
        with with_audit_action('CHANGE_STATUS'):
            group.save()

        estado = 'activado' if group.status == 1 else 'desactivado'

        return ApiResponse.success(
            data=GroupDetailSerializer(group).data,
            message=f'Grupo {estado} correctamente',
        )
