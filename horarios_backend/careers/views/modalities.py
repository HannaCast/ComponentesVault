from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from careers.models import Modalities
from django.db import transaction
from careers.serializers.modalities import ModalitiesWriteSerializer, ModalitiesDetailSerializer, ModalitiesListSerializer, ModalitiesSelectSerializer

@extend_schema(tags=['Modalities'])
class ModalitiesListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        """ Lista de modalidades activas (para selects) """
        selected_university_id = request.selected_university_id

        modalities = Modalities.objects.filter(
            status=1,
            university_id=selected_university_id,
        )
        return ApiResponse.success(
            ModalitiesSelectSerializer(modalities, many=True).data
        )

    @extend_schema(request=ModalitiesWriteSerializer)
    @transaction.atomic
    def post(self, request):
        """ Crear modalidad """
        selected_university_id = request.selected_university_id

        serializer = ModalitiesWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            modality = serializer.save()
            return ApiResponse.created(
                ModalitiesDetailSerializer(modality).data
            )
        return ApiResponse.error(errors=serializer.errors)

@extend_schema(tags=['Modalities'])
class ModalitiesPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {'id', 'name', 'require_classroom'}

    @extend_schema(
        summary='Lista paginada de modalidades',
        description='Retorna las modalidades de forma paginada con soporte de búsqueda, filtro por status y ordenamiento.',
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
                default=10,),
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
                description='Filtro por estado: true (activos) / false (inactivos). Sin valor: retorna todas las modalidades de la universidad seleccionada.',
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Campo de ordenamiento: id, name, require_classroom (por defecto: id)',
                default='id',
                required=False,            ),
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
        """ Lista paginada de modalidades con búsqueda, filtro por status y ordenamiento """
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

        queryset = Modalities.objects.filter(
            university_id=selected_university_id,
        )

        if status_param is not None:
            queryset = queryset.filter(
                status=1 if status_param.lower() == 'true' else 0
            )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        modalities = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=ModalitiesListSerializer(modalities, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )



@extend_schema(tags=['Modalities'])
class ModalitiesDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk):
        try:
            return Modalities.objects.get(pk=pk)
        except Modalities.DoesNotExist:
            return None

    def get(self, request, pk):
        modality = self.get_object(pk)
        if modality is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            ModalitiesDetailSerializer(modality).data
        )

    @extend_schema(request=ModalitiesWriteSerializer)
    @transaction.atomic
    def put(self, request, pk):
        modality = self.get_object(pk)
        if modality is None:
            return ApiResponse.not_found()

        serializer = ModalitiesWriteSerializer(
            modality, data=request.data, partial=True
        )

        if serializer.is_valid():
            modality = serializer.save()
            return ApiResponse.success(
                ModalitiesDetailSerializer(modality).data,
                message='Modalidad actualizada correctamente'
            )

        return ApiResponse.error(errors=serializer.errors)
    
    @transaction.atomic
    def delete(self, request, pk):
        modality = self.get_object(pk)
        if modality is None:
            return ApiResponse.not_found()
        modality.delete()

        return ApiResponse.deleted('Modalidad eliminada correctamente')


@extend_schema(tags=['Modalities'])
class ModalitiesToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @transaction.atomic
    def put(self, request, pk):
        try:
            modality = Modalities.objects.get(pk=pk)
        except Modalities.DoesNotExist:
            return ApiResponse.not_found()

        modality.status = 0 if modality.status == 1 else 1
        modality.save()

        estado = 'activada' if modality.status == 1 else 'desactivada'

        return ApiResponse.success(
            data=ModalitiesDetailSerializer(modality).data,
            message=f'Modalidad {estado} correctamente'
        )