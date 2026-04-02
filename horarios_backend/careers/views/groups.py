from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from core.api_response import ApiResponse
from careers.models.groups import Groups
from careers.serializers.groups.group_write_serializer import GroupWriteSerializer,GroupListSerializer,GroupDetailSerializer



# ──────────────────────────────────────────
# CREATE
# ──────────────────────────────────────────
@extend_schema(tags=['Groups'])
class GroupCreate(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=GroupWriteSerializer,
        responses=GroupDetailSerializer,
        summary="Crear grupo"
    )
    def post(self, request):
        serializer = GroupWriteSerializer(
            data=request.data,
            context={
                'selected_university_id': request.headers.get('X-University-Id')
            }
        )

        if serializer.is_valid():
            group = serializer.save(
                created_at=timezone.now(),
                created_by=request.user.get_username(),
                is_deleted=0
            )
            return ApiResponse.created(GroupDetailSerializer(group).data)

        return ApiResponse.error(errors=serializer.errors)


# ──────────────────────────────────────────
# LIST
# ──────────────────────────────────────────
@extend_schema(tags=['Groups'])
class GroupList(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=GroupListSerializer(many=True),
        summary="Listar grupos"
    )
    def get(self, request):
        groups = Groups.objects.filter(status=1, is_deleted=0)
        return ApiResponse.success(GroupListSerializer(groups, many=True).data)


# ──────────────────────────────────────────
# DETAIL / UPDATE / DELETE
# ──────────────────────────────────────────
@extend_schema(tags=['Groups'])
class GroupDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, group_id):
        try:
            return Groups.objects.get(id=group_id, is_deleted=0)
        except Groups.DoesNotExist:
            return None

    @extend_schema(responses=GroupDetailSerializer, summary="Obtener grupo")
    def get(self, request, group_id):
        group = self.get_object(group_id)

        if not group:
            return ApiResponse.error(message="Grupo no encontrado", status_code=404)

        return ApiResponse.success(GroupDetailSerializer(group).data)

    @extend_schema(
        request=GroupWriteSerializer,
        responses=GroupDetailSerializer,
        summary="Actualizar grupo"
    )
    def put(self, request, group_id):
        group = self.get_object(group_id)

        if not group:
            return ApiResponse.error(message="Grupo no encontrado", status_code=404)

        serializer = GroupWriteSerializer(
            group,
            data=request.data,
            context={
                'selected_university_id': request.headers.get('X-University-Id')
            }
        )

        if serializer.is_valid():
            serializer.save(
                updated_at=timezone.now(),
                updated_by=request.user.get_username()
            )
            return ApiResponse.success(GroupDetailSerializer(group).data)

        return ApiResponse.error(errors=serializer.errors)

    @extend_schema(responses=None, summary="Eliminar grupo")
    def delete(self, request, group_id):
        group = self.get_object(group_id)

        if not group:
            return ApiResponse.error(message="Grupo no encontrado", status_code=404)

        group.is_deleted = 1
        group.save()

        return ApiResponse.success(message="Grupo eliminado correctamente")