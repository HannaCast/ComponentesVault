from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from universities.models import Universities
from universities.serializers import UniversityWriteSerializer
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.utils import timezone


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
    

    def get(self, request):
        """Listar universidades activas"""
        universities = Universities.objects.filter(
            user=request.user,
            status=1,
            is_deleted=0,
        ).select_related('image')

        return ApiResponse.success(
            UniversityWriteSerializer(
                universities,
                many=True,
                context={'request': request},
            ).data
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