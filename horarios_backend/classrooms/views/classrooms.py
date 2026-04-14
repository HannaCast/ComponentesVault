from django.db import transaction
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from careers.models import CareerSubjects, Careers
from core.audit_context import with_audit_action, with_audit_context
from classrooms.models import Classrooms
from classrooms.serializers import (
    ClassroomDetailSerializer,
    ClassroomListSerializer,
    ClassroomSelectSerializer,
    ClassroomWriteSerializer,
)
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Classrooms'])
class ClassroomListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        selected_university_id = request.selected_university_id

        queryset = Classrooms.objects.filter(
            status=1,
            is_deleted=0,
            universities_id=selected_university_id,
        ).select_related('classroom_type').order_by('name', 'id')

        return ApiResponse.success(
            ClassroomSelectSerializer(queryset, many=True).data
        )

    @extend_schema(request=ClassroomWriteSerializer)
    @with_audit_context(table_name='classrooms')
    @transaction.atomic
    def post(self, request):
        selected_university_id = request.selected_university_id

        serializer = ClassroomWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(
                ClassroomDetailSerializer(row).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Classrooms'])
class ClassroomPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {
        'id',
        'name',
        'code',
        'building',
        'building_code',
        'is_restricted',
        'status',
    }

    @extend_schema(
        summary='Lista paginada de aulas',
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
                description='Texto de búsqueda (name, code, building, building_code)',
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filtro por estado: true/false (sin valor: todos)',
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='classroom_type_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por id de tipo de aula',
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Campo de ordenamiento: id, name, code, building, building_code, '
                    'is_restricted, status (por defecto: id)'
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
        selected_university_id = request.selected_university_id

        page = max(1, int(request.query_params.get('page', 1)))
        limit = max(1, int(request.query_params.get('limit', 10)))
        search = request.query_params.get('search', '').strip()
        status_param = request.query_params.get('status', None)
        classroom_type_id_param = request.query_params.get('classroom_type_id', None)
        sort_by = request.query_params.get('sortBy', 'id')
        order = request.query_params.get('order', 'ASC').upper()
        offset = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'
        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = Classrooms.objects.filter(
            is_deleted=0,
            universities_id=selected_university_id,
        ).select_related('classroom_type')

        if status_param is not None:
            queryset = queryset.filter(
                status=1 if status_param.lower() == 'true' else 0
            )

        if classroom_type_id_param is not None:
            try:
                queryset = queryset.filter(classroom_type_id=int(classroom_type_id_param))
            except (TypeError, ValueError):
                pass

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(building__icontains=search)
                | Q(building_code__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        rows = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=ClassroomListSerializer(rows, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Classrooms'])
class ClassroomSubjectPeriodsView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        summary='Periodos con materias por carrera (catalogo para aulas)',
        parameters=[
            OpenApiParameter(
                name='career_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Id de carrera para listar periodos que tienen materias asociadas.',
                required=True,
            ),
        ],
    )
    def get(self, request):
        selected_university_id = request.selected_university_id
        raw_career_id = request.query_params.get('career_id', None)

        if raw_career_id in (None, ''):
            return ApiResponse.error(
                message='Debes enviar career_id.',
                status_code=400,
            )

        try:
            career_id = int(raw_career_id)
        except (TypeError, ValueError):
            return ApiResponse.error(
                message='career_id debe ser un entero valido.',
                status_code=400,
            )

        career_exists = Careers.objects.filter(
            id=career_id,
            university_id=selected_university_id,
            is_deleted=0,
        ).exists()
        if not career_exists:
            return ApiResponse.error(
                message='La carrera no pertenece a la universidad seleccionada.',
                status_code=400,
            )

        period_numbers = (
            CareerSubjects.objects.filter(
                is_deleted=0,
                careers_id=career_id,
                careers__is_deleted=0,
                careers__university_id=selected_university_id,
                subjects__is_deleted=0,
                subjects__status=1,
                subjects__university_id=selected_university_id,
            )
            .values_list('period_number', flat=True)
            .distinct()
            .order_by('period_number')
        )

        data = [
            {
                'value': period_number,
                'label': f'Periodo {period_number}',
                'period_number': period_number,
            }
            for period_number in period_numbers
        ]

        return ApiResponse.success(data)


@extend_schema(tags=['Classrooms'])
class ClassroomSubjectOptionsView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        summary='Materias por carrera y periodo (catalogo para aulas)',
        parameters=[
            OpenApiParameter(
                name='career_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Id de carrera para filtrar materias.',
                required=True,
            ),
            OpenApiParameter(
                name='period_number',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Numero de periodo para filtrar materias.',
                required=True,
            ),
        ],
    )
    def get(self, request):
        selected_university_id = request.selected_university_id
        raw_career_id = request.query_params.get('career_id', None)
        raw_period_number = request.query_params.get('period_number', None)

        if raw_career_id in (None, ''):
            return ApiResponse.error(
                message='Debes enviar career_id.',
                status_code=400,
            )

        if raw_period_number in (None, ''):
            return ApiResponse.error(
                message='Debes enviar period_number.',
                status_code=400,
            )

        try:
            career_id = int(raw_career_id)
        except (TypeError, ValueError):
            return ApiResponse.error(
                message='career_id debe ser un entero valido.',
                status_code=400,
            )

        try:
            period_number = int(raw_period_number)
        except (TypeError, ValueError):
            return ApiResponse.error(
                message='period_number debe ser un entero valido.',
                status_code=400,
            )

        if period_number <= 0:
            return ApiResponse.error(
                message='period_number debe ser mayor a 0.',
                status_code=400,
            )

        career_exists = Careers.objects.filter(
            id=career_id,
            university_id=selected_university_id,
            is_deleted=0,
        ).exists()
        if not career_exists:
            return ApiResponse.error(
                message='La carrera no pertenece a la universidad seleccionada.',
                status_code=400,
            )

        rows = (
            CareerSubjects.objects.filter(
                is_deleted=0,
                careers_id=career_id,
                period_number=period_number,
                careers__is_deleted=0,
                careers__university_id=selected_university_id,
                subjects__is_deleted=0,
                subjects__status=1,
                subjects__university_id=selected_university_id,
            )
            .values(
                'subjects_id',
                'subjects__name',
                'subjects__short_name',
                'subjects__code',
            )
            .distinct()
            .order_by('subjects__name', 'subjects_id')
        )

        data = [
            {
                'id': row['subjects_id'],
                'name': row['subjects__name'],
                'short_name': row['subjects__short_name'],
                'code': row['subjects__code'],
                'career_id': career_id,
                'period_number': period_number,
            }
            for row in rows
        ]

        return ApiResponse.success(data)


@extend_schema(tags=['Classrooms'])
class ClassroomDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return Classrooms.objects.select_related('classroom_type').get(
                pk=pk,
                is_deleted=0,
                universities_id=university_id,
            )
        except Classrooms.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ClassroomDetailSerializer(row).data)

    @extend_schema(request=ClassroomWriteSerializer)
    @with_audit_context(table_name='classrooms')
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = ClassroomWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                ClassroomDetailSerializer(row).data,
                message='Aula actualizada correctamente',
            )
        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='classrooms')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()

        return ApiResponse.deleted('Aula eliminada correctamente')


@extend_schema(tags=['Classrooms'])
class ClassroomToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @with_audit_context(table_name='classrooms')
    @transaction.atomic
    def put(self, request, pk):
        try:
            row = Classrooms.objects.get(
                pk=pk,
                is_deleted=0,
                universities_id=request.selected_university_id,
            )
        except Classrooms.DoesNotExist:
            return ApiResponse.not_found()

        row.status = 0 if row.status == 1 else 1
        with with_audit_action('CHANGE_STATUS'):
            row.save()

        estado = 'activada' if row.status == 1 else 'desactivada'
        return ApiResponse.success(
            data=ClassroomDetailSerializer(row).data,
            message=f'Aula {estado} correctamente',
        )

