from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils import timezone

from core.api_response import ApiResponse
from universities.models.shifts import Shifts
from universities.serializers.shifts import ShiftWriteSerializer, ShiftListSerializer, ShiftDetailSerializer


@extend_schema(tags=['Shifts'])
class ShiftList(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=ShiftListSerializer(many=True),
        summary="Listar turnos"
    )
    def get(self, request):
        shifts = Shifts.objects.filter(status=1, is_deleted=0)
        return ApiResponse.success(ShiftListSerializer(shifts, many=True).data)


@extend_schema(tags=['Shifts'])
class ShiftCreate(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ShiftWriteSerializer,
        responses=ShiftDetailSerializer,
        summary="Crear turno",
        parameters=[
            OpenApiParameter(
                name='X-University-Id',
                location=OpenApiParameter.HEADER,
                description='ID de la universidad',
                required=True,
                type=int
            )
        ]
    )
    def post(self, request):
        serializer = ShiftWriteSerializer(
            data=request.data,
            context={'selected_university_id': request.headers.get('X-University-Id')}
        )

        if serializer.is_valid():
            shift = serializer.save(
                created_at=timezone.now(),
                created_by=request.user.get_username(),
            )
            return ApiResponse.created(ShiftDetailSerializer(shift).data)

        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Shifts'])
class ShiftDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, shift_id):
        try:
            return Shifts.objects.get(id=shift_id, is_deleted=0)
        except Shifts.DoesNotExist:
            return None

    @extend_schema(
        responses=ShiftDetailSerializer,
        summary="Obtener turno"
    )
    def get(self, request, shift_id):
        shift = self.get_object(shift_id)
        if not shift:
            return ApiResponse.error(message="Turno no encontrado", status_code=404)
        return ApiResponse.success(ShiftDetailSerializer(shift).data)

    @extend_schema(
        request=ShiftWriteSerializer,
        responses=ShiftDetailSerializer,
        summary="Actualizar turno",
        parameters=[
            OpenApiParameter(
                name='X-University-Id',
                location=OpenApiParameter.HEADER,
                description='ID de la universidad',
                required=True,
                type=int
            )
        ]
    )
    def put(self, request, shift_id):
        shift = self.get_object(shift_id)
        if not shift:
            return ApiResponse.error(message="Turno no encontrado", status_code=404)

        serializer = ShiftWriteSerializer(
            shift,
            data=request.data,
            context={'selected_university_id': request.headers.get('X-University-Id')}
        )

        if serializer.is_valid():
            serializer.save(
                updated_at=timezone.now(),
                updated_by=request.user.get_username()
            )
            return ApiResponse.success(ShiftDetailSerializer(shift).data)

        return ApiResponse.error(errors=serializer.errors)

    @extend_schema(
        responses=None,
        summary="Eliminar turno"
    )
    def delete(self, request, shift_id):
        shift = self.get_object(shift_id)
        if not shift:
            return ApiResponse.error(message="Turno no encontrado", status_code=404)

        shift.is_deleted = 1
        shift.save()
        return ApiResponse.success(message="Turno eliminado correctamente")