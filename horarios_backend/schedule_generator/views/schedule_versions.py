import ast
from dataclasses import asdict

from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from core.audit_context import with_audit_context
from core.permissions import RequireSelectedUniversity
from schedule_generator.serializers import (
    ScheduleVersionDetailSerializer,
    ScheduleVersionGenerateSerializer,
    ScheduleVersionListSerializer,
    ScheduleVersionUpdateDraftSerializer,
    ScheduleVersionUpdateLabelSerializer,
)
from schedule_generator.services import (
    confirm_schedule_version,
    delete_draft_schedule_version,
    generate_or_update_draft_schedule_version,
    generate_schedule,
    get_schedule_version_by_id,
    get_schedule_versions_queryset,
    update_draft_schedule_version,
    update_schedule_version_label,
)


def _generation_error_response(error_code: str):
    _PREFIX = 'TEACHERS_WITHOUT_AVAILABILITY:'
    if error_code.startswith(_PREFIX):
        try:
            teachers_detail = ast.literal_eval(error_code[len(_PREFIX):])
        except (ValueError, SyntaxError):
            teachers_detail = []
        return ApiResponse.error(
            message='Hay profesores asignados a materias que no tienen disponibilidad configurada.',
            status_code=422,
            errors={'teachers': teachers_detail},
        )

    messages = {
        'NO_UNIVERSITY_SELECTED': 'No hay universidad seleccionada para generar el horario.',
        'UNIVERSITY_NOT_FOUND': 'La universidad seleccionada no existe o está inactiva.',
        'NO_ACTIVE_GROUPS': 'No hay grupos activos para generar horario en esta universidad.',
        'NO_SCHEDULABLE_SUBJECTS': 'No hay materias u horarios base disponibles para generar un horario.',
        'NO_ACTIVE_PERIOD': 'No hay periodo académico activo configurado.',
        'ACADEMIC_PERIOD_NOT_FOUND': 'El periodo académico enviado no existe para la universidad seleccionada.',
        'TEACHERS_WITHOUT_AVAILABILITY': 'Hay profesores asignados a materias que no tienen disponibilidad configurada.',
    }
    return ApiResponse.error(
        message=messages.get(error_code, error_code),
        status_code=422,
    )


def _version_error_response(error_code: str):
    messages = {
        'DRAFT_NOT_FOUND': 'No se encontró un borrador activo con ese identificador.',
        'VERSION_NOT_FOUND': 'No se encontró una versión de horario con ese identificador.',
        'ACADEMIC_PERIOD_NOT_FOUND': 'El periodo académico enviado no existe para la universidad seleccionada.',
    }

    status_code = 404 if error_code in {'DRAFT_NOT_FOUND', 'VERSION_NOT_FOUND'} else 422

    return ApiResponse.error(
        message=messages.get(error_code, error_code),
        status_code=status_code,
    )


@extend_schema(tags=['Schedule generator'])
class ScheduleGeneratorPreviewView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def post(self, request):
        """Genera un horario en memoria para la universidad seleccionada sin persistir versión."""
        selected_university_id = request.selected_university_id

        try:
            result = generate_schedule(university_id=selected_university_id)
            return ApiResponse.success(
                data=asdict(result),
                message='Horario generado exitosamente.',
            )
        except ValueError as exc:
            return _generation_error_response(str(exc))


@extend_schema(tags=['Schedule generator'])
class ScheduleVersionGenerateView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(request=ScheduleVersionGenerateSerializer)
    @with_audit_context(table_name='schedule_versions')
    def post(self, request):
        """Genera el horario y crea o actualiza el borrador activo de la universidad seleccionada."""
        serializer = ScheduleVersionGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        try:
            schedule_version = generate_or_update_draft_schedule_version(
                university_id=request.selected_university_id,
                user=request.user,
                target_period_id=serializer.validated_data.get('academic_period_id'),
                parameters=serializer.validated_data.get('parameters'),
                is_confirmed_default=serializer.validated_data.get('is_confirmed', 0),
                is_deleted_default=serializer.validated_data.get('is_deleted', 0),
            )
        except ValueError as exc:
            return _generation_error_response(str(exc))

        return ApiResponse.success(
            data=ScheduleVersionDetailSerializer(schedule_version).data,
            message='Borrador de horario generado/actualizado exitosamente.',
        )


@extend_schema(tags=['Schedule generator'])
class ScheduleVersionDraftDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(request=ScheduleVersionUpdateDraftSerializer)
    @with_audit_context(table_name='schedule_versions')
    def put(self, request, pk):
        """Actualiza un borrador existente sin modificar su estado de confirmación."""
        serializer = ScheduleVersionUpdateDraftSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        try:
            schedule_version = update_draft_schedule_version(
                version_id=pk,
                university_id=request.selected_university_id,
                user=request.user,
                updates=serializer.validated_data,
            )
        except ValueError as exc:
            return _version_error_response(str(exc))

        return ApiResponse.success(
            data=ScheduleVersionDetailSerializer(schedule_version).data,
            message='Borrador actualizado correctamente.',
        )

    @with_audit_context(table_name='schedule_versions')
    def delete(self, request, pk):
        """Elimina de forma lógica un borrador no confirmado."""
        try:
            delete_draft_schedule_version(
                version_id=pk,
                university_id=request.selected_university_id,
                user=request.user,
            )
        except ValueError as exc:
            return _version_error_response(str(exc))

        return ApiResponse.deleted('Borrador eliminado correctamente.')


@extend_schema(tags=['Schedule generator'])
class ScheduleVersionConfirmView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @with_audit_context(table_name='schedule_versions')
    def put(self, request, pk):
        """Confirma una versión y libera el registro de borrador activo para la universidad."""
        try:
            schedule_version = confirm_schedule_version(
                version_id=pk,
                university_id=request.selected_university_id,
                user=request.user,
            )
        except ValueError as exc:
            return _version_error_response(str(exc))

        return ApiResponse.success(
            data=ScheduleVersionDetailSerializer(schedule_version).data,
            message='Versión confirmada correctamente.',
        )


@extend_schema(tags=['Schedule generator'])
class ScheduleVersionLabelView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(request=ScheduleVersionUpdateLabelSerializer)
    @with_audit_context(table_name='schedule_versions')
    def put(self, request, pk):
        """Actualiza únicamente el label de una versión de horario."""
        serializer = ScheduleVersionUpdateLabelSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        try:
            schedule_version = update_schedule_version_label(
                version_id=pk,
                university_id=request.selected_university_id,
                user=request.user,
                label=serializer.validated_data['label'],
            )
        except ValueError as exc:
            return _version_error_response(str(exc))

        return ApiResponse.success(
            data=ScheduleVersionDetailSerializer(schedule_version).data,
            message='Label actualizado correctamente.',
        )


@extend_schema(tags=['Schedule generator'])
class ScheduleVersionPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                default=1,
                description='Número de página (por defecto: 1).',
            ),
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                default=10,
                description='Cantidad de resultados por página (por defecto: 10).',
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Texto para buscar por label.',
            ),
            OpenApiParameter(
                name='confirmed',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                enum=['true', 'false'],
                required=False,
                description='Filtra por versiones confirmadas (true) o borradores (false).',
            ),
            OpenApiParameter(
                name='academic_period_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filtra por periodo académico.',
            ),
        ]
    )
    def get(self, request):
        """Historial paginado de versiones de horario (más recientes primero)."""
        page = max(1, int(request.query_params.get('page', 1)))
        limit = max(1, int(request.query_params.get('limit', 10)))
        search = request.query_params.get('search', '').strip()
        confirmed_param = request.query_params.get('confirmed', None)
        academic_period_id = request.query_params.get('academic_period_id', None)
        offset = (page - 1) * limit

        queryset = get_schedule_versions_queryset(
            university_id=request.selected_university_id
        )

        if search:
            queryset = queryset.filter(Q(label__icontains=search))

        if confirmed_param is not None:
            is_confirmed = 1 if confirmed_param.lower() == 'true' else 0
            queryset = queryset.filter(is_confirmed=is_confirmed)

        if academic_period_id is not None:
            queryset = queryset.filter(academic_period_id=academic_period_id)

        total = queryset.count()
        rows = queryset[offset:offset + limit]

        return ApiResponse.paginated(
            data=ScheduleVersionListSerializer(rows, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Schedule generator'])
class ScheduleVersionDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request, pk):
        """Detalle de una versión de horario dentro de la universidad seleccionada."""
        schedule_version = get_schedule_version_by_id(
            version_id=pk,
            university_id=request.selected_university_id,
        )

        if schedule_version is None:
            return ApiResponse.not_found()

        return ApiResponse.success(
            data=ScheduleVersionDetailSerializer(schedule_version).data,
        )
