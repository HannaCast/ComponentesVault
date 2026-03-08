from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from core.api_response import ApiResponse
from core.permissions import IsAdmin, require_permissions
from subjects.models import Colors
from subjects.serializers import ColorWriteSerializer, ColorDetailSerializer, ColorListSerializer


@extend_schema(tags=['Colors'])
class ColorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Lista los colores activos y no eliminados (para selects/dropdowns) """
        colors = Colors.objects.filter(status=1, is_deleted=0)
        return ApiResponse.success(ColorListSerializer(colors, many=True).data)

    @require_permissions(IsAdmin)
    @extend_schema(request=ColorWriteSerializer)
    def post(self, request):
        """ Crea un nuevo color """
        serializer = ColorWriteSerializer(data=request.data)
        if serializer.is_valid():
            color = serializer.save()
            return ApiResponse.created(ColorDetailSerializer(color).data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Colors'])
class ColorPaginatedView(APIView):
    permission_classes = [IsAuthenticated]

    SORT_FIELDS = {'id', 'name', 'hex', 'contrast_hex'}

    @extend_schema(
        summary='Lista paginada de colores',
        description='Retorna los colores de forma paginada con soporte de búsqueda, filtro por status y ordenamiento.',
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
                description='Término de búsqueda en nombre o hex del color',
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
        """ Lista paginada de colores con búsqueda, filtro por status y ordenamiento """
        page         = max(1, int(request.query_params.get('page', 1)))
        limit        = max(1, int(request.query_params.get('limit', 10)))
        search       = request.query_params.get('search', '').strip()
        status_param = request.query_params.get('status', None)
        sort_by      = request.query_params.get('sortBy', 'id')
        order        = request.query_params.get('order', 'ASC').upper()
        offset       = (page - 1) * limit

        # Validar campo de ordenamiento para evitar inyección de parámetros
        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'

        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = Colors.objects.filter(is_deleted=0)

        if status_param is not None:
            queryset = queryset.filter(status=1 if status_param.lower() == 'true' else 0)

        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(hex__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total    = queryset.count()
        colors   = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=ColorListSerializer(colors, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Colors'])
class ColorDetailView(APIView):
    permission_classes = [IsAuthenticated]


    def get_object(self, pk):
        """ Busca un color no eliminado por su ID, retorna None si no existe o fue eliminado """
        try:
            return Colors.objects.get(pk=pk, is_deleted=0)
        except Colors.DoesNotExist:
            return None

    def get(self, request, pk):
        """ Obtiene un color por ID """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ColorDetailSerializer(color).data)

    @require_permissions(IsAdmin)
    @extend_schema(request=ColorWriteSerializer)
    def put(self, request, pk):
        """ Actualiza uno o varios campos de un color (todos los campos son opcionales) """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        serializer = ColorWriteSerializer(color, data=request.data, partial=True)
        if serializer.is_valid():
            color = serializer.save()
            return ApiResponse.success(ColorDetailSerializer(color).data, message='Color actualizado exitosamente')
        return ApiResponse.error(errors=serializer.errors)

    @require_permissions(IsAdmin)
    def delete(self, request, pk):
        """ Eliminación lógica: marca is_deleted = 1 """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        color.is_deleted = 1
        color.save()
        return ApiResponse.deleted('Color eliminado exitosamente')


@extend_schema(tags=['Colors'])
class ColorToggleStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @require_permissions(IsAdmin)
    def put(self, request, pk):
        """ Alterna el status de un color entre activo (1) e inactivo (0) """
        try:
            color = Colors.objects.get(pk=pk, is_deleted=0)
        except Colors.DoesNotExist:
            return ApiResponse.not_found()

        color.status = 0 if color.status == 1 else 1
        color.save()

        estado = 'activado' if color.status == 1 else 'desactivado'
        return ApiResponse.success(
            data=ColorDetailSerializer(color).data,
            message=f'Color {estado} exitosamente',
        )
