from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from core.api_response import ApiResponse
from universities.models import Universities
from universities.serializers import UniversityWriteSerializer
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.utils import timezone
from django.db.models import Q


@extend_schema(tags=['Universities'])
class UniversityCreate(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    @extend_schema(
        request=UniversityWriteSerializer,
        responses=UniversityWriteSerializer,
        description="Crear una nueva universidad",
        summary="Crear universidad"
    )
    def post(self, request):
        """Crear una universidad"""

        serializer = UniversityWriteSerializer(data=request.data)

        if serializer.is_valid():
            university = serializer.save(
                user=request.user,
                created_at=timezone.now(),
                created_by=request.user.get_username()
            )

            return ApiResponse.created(
                UniversityWriteSerializer(
                    university,
                    context={'request': request},
                ).data
            )

        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Universities'])
class UniversityList(APIView):
    permission_classes = [IsAuthenticated]

    SORT_FIELDS = {
        'id',
        'name',
        'short_name',
        'institution_code',
        'start_time',
        'end_time',
    }

    @extend_schema(
        summary='Lista paginada de universidades',
        description='Retorna universidades del usuario autenticado con paginación, búsqueda y ordenamiento.',
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
                description='Texto de búsqueda por nombre, nombre corto o código institucional.',
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Campo de ordenamiento (por defecto: name).',
                default='name',
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
        """Listar universidades activas del usuario autenticado."""

        def _positive_int(value, default):
            try:
                parsed = int(value)
                return parsed if parsed > 0 else default
            except (TypeError, ValueError):
                return default

        page = _positive_int(request.query_params.get('page', 1), 1)
        limit = _positive_int(request.query_params.get('limit', 10), 10)
        search = request.query_params.get('search', '').strip()
        sort_by = request.query_params.get('sortBy', 'name')
        order = request.query_params.get('order', 'ASC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'name'

        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = Universities.objects.filter(
            user=request.user,
            status=1,
            is_deleted=0,
        ).select_related('image')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(short_name__icontains=search)
                | Q(institution_code__icontains=search)
            )

        queryset = queryset.order_by(order_field, 'id')
        total = queryset.count()
        universities = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=UniversityWriteSerializer(
                universities, many=True, context={'request': request}
            ).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Universities'])
class UniversityDetail(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def get_object(self, request, university_id):
        try:
            return Universities.objects.select_related('image').get(
                id=university_id,
                user=request.user,
                status=1,
                is_deleted=0
            )
        except Universities.DoesNotExist:
            return None


    @extend_schema(responses=UniversityWriteSerializer)
    def get(self, request, university_id):
        """Obtener universidad por ID"""
        university = self.get_object(request, university_id)

        if not university:
            return ApiResponse.error(
                message="Universidad no encontrada",
                status_code=404
            )

        return ApiResponse.success(
            UniversityWriteSerializer(
                university,
                context={'request': request},
            ).data
        )

    @extend_schema(
        request=UniversityWriteSerializer,
        responses=UniversityWriteSerializer
    )
    def put(self, request, university_id):
        """Actualizar universidad"""
        university = self.get_object(request, university_id)

        if not university:
            return ApiResponse.error(
                message="Universidad no encontrada",
                status_code=404
            )

        serializer = UniversityWriteSerializer(
            university,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            instance = serializer.save(
                updated_at=timezone.now(),
                updated_by=request.user.get_username(),
            )
            return ApiResponse.success(
                UniversityWriteSerializer(
                    instance,
                    context={'request': request},
                ).data
            )

        return ApiResponse.error(errors=serializer.errors)

    @extend_schema(responses=None)
    def delete(self, request, university_id):
        """Eliminar universidad (soft delete)"""
        university = self.get_object(request, university_id)

        if not university:
            return ApiResponse.error(
                message="Universidad no encontrada",
                status_code=404
            )

        university.is_deleted = 1
        university.save()

        return ApiResponse.success(
            message="Universidad eliminada correctamente"
        )