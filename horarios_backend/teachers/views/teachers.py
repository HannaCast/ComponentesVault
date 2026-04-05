from django.db import IntegrityError, transaction
from django.db.models import Max, OuterRef, Q, Subquery

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.audit_context import with_audit_action, with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from teachers.models import Teachers, TeachersUniversities
from teachers.serializers import (
    TeacherAvailabilityInputSerializer,
    TeacherCompositePayloadSerializer,
    TeacherDetailSerializer,
    TeacherFullDetailSerializer,
    TeacherListSerializer,
    TeacherSelectSerializer,
    TeacherSubjectRefSerializer,
    TeacherWriteSerializer,
)
from teachers.services.teacher_bundle import (
    replace_teacher_availabilities,
    replace_teacher_subjects,
)


def _teachers_queryset_for_university(university_id: int):
    """Profesores con vínculo no eliminado a la universidad + anotación de status del vínculo."""
    link_for_uni = TeachersUniversities.objects.filter(
        teachers_id=OuterRef('pk'),
        universities_id=university_id,
        is_deleted=0,
    )
    return (
        Teachers.objects.filter(
            pk__in=TeachersUniversities.objects.filter(
                universities_id=university_id,
                is_deleted=0,
            ).values('teachers_id'),
            is_deleted=0,
        )
        .annotate(
            university_link_status=Subquery(link_for_uni.values('status')[:1]),
        )
    )


def _ensure_teacher_university_link(teacher: Teachers, university_id: int) -> None:
    """Crea el vínculo en teachers_universities (la lista paginada solo incluye profesores vinculados)."""
    if TeachersUniversities.objects.filter(
        teachers_id=teacher.pk,
        universities_id=university_id,
        is_deleted=0,
    ).exists():
        return
    next_id = (TeachersUniversities.objects.aggregate(m=Max('id'))['m'] or 0) + 1
    TeachersUniversities.objects.create(
        id=next_id,
        teachers=teacher,
        universities_id=university_id,
        status=1,
        is_deleted=0,
    )


@extend_schema(tags=['Teachers'])
class TeacherListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        """Profesores activos globalmente y activos en la universidad (selects)."""
        uid = request.selected_university_id
        qs = (
            _teachers_queryset_for_university(uid)
            .filter(status=1, university_link_status=1)
            .order_by('surname', 'name', 'id')
        )
        return ApiResponse.success(
            TeacherSelectSerializer(qs, many=True).data
        )

    @extend_schema(
        request=TeacherCompositePayloadSerializer,
        responses=TeacherFullDetailSerializer,
    )
    @with_audit_context(table_name='teachers')
    @transaction.atomic
    def post(self, request):
        """Crea profesor + vínculo universidad + disponibilidades + materias (una transacción)."""
        uid = request.selected_university_id
        payload = TeacherCompositePayloadSerializer(data=request.data)
        if not payload.is_valid():
            return ApiResponse.error(errors=payload.errors)

        vd = payload.validated_data
        tw = TeacherWriteSerializer(
            data={
                'name': vd['name'],
                'surname': vd['surname'],
                'last_name': vd.get('last_name'),
                'require_classroom': 1 if vd['require_classroom'] else 0,
            },
            context={
                'request': request,
                'selected_university_id': uid,
            },
        )
        if not tw.is_valid():
            return ApiResponse.error(errors=tw.errors)

        try:
            teacher = tw.save()
            _ensure_teacher_university_link(teacher, uid)
            replace_teacher_availabilities(teacher, vd['availabilities'])
            replace_teacher_subjects(teacher, uid, vd['subjects'])
        except IntegrityError:
            return ApiResponse.error(
                message='No se pudo registrar el profesor o sus relaciones.',
                status_code=400,
            )
        except serializers.ValidationError as exc:
            return ApiResponse.error(errors=exc.detail)

        return ApiResponse.created(
            TeacherFullDetailSerializer(
                teacher,
                context={'selected_university_id': uid},
            ).data
        )


@extend_schema(tags=['Teachers'])
class TeacherPaginatedView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    SORT_FIELDS = {'id', 'name', 'surname', 'last_name'}

    @extend_schema(
        summary='Lista paginada de profesores',
        description=(
            'Profesores vinculados a la universidad seleccionada. '
            'El filtro status aplica al vínculo (teachers_universities), no solo al registro global.'
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
                description='Búsqueda en nombre, apellido paterno o materno',
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Filtro por estado del vínculo con la universidad: '
                    'true (activo en esta universidad) / false (inactivo). '
                    'Sin valor: todos los vinculados no eliminados.'
                ),
                enum=['true', 'false'],
                required=False,
            ),
            OpenApiParameter(
                name='sortBy',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='id, name, surname, last_name (por defecto: id)',
                default='id',
                required=False,
            ),
            OpenApiParameter(
                name='order',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='ASC, DESC (por defecto: ASC)',
                enum=['ASC', 'DESC'],
                default='ASC',
                required=False,
            ),
        ],
    )
    def get(self, request):
        uid = request.selected_university_id
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

        queryset = _teachers_queryset_for_university(uid)

        if status_param is not None:
            want = 1 if status_param.lower() == 'true' else 0
            queryset = queryset.filter(university_link_status=want)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(surname__icontains=search)
                | Q(last_name__icontains=search)
            )

        queryset = queryset.order_by(order_field)
        total = queryset.count()
        teachers = queryset[offset : offset + limit]

        return ApiResponse.paginated(
            data=TeacherListSerializer(teachers, many=True).data,
            page=page,
            limit=limit,
            total=total,
        )


@extend_schema(tags=['Teachers'])
class TeacherDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_teacher_for_university(self, pk, university_id):
        return (
            Teachers.objects.filter(
                pk=pk,
                is_deleted=0,
                pk__in=TeachersUniversities.objects.filter(
                    universities_id=university_id,
                    is_deleted=0,
                ).values('teachers_id'),
            )
            .first()
        )

    @extend_schema(responses=TeacherFullDetailSerializer)
    def get(self, request, pk):
        uid = request.selected_university_id
        teacher = self.get_teacher_for_university(pk, uid)
        if teacher is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            TeacherFullDetailSerializer(
                teacher,
                context={'selected_university_id': uid},
            ).data
        )

    @extend_schema(
        request=TeacherCompositePayloadSerializer,
        responses=TeacherFullDetailSerializer,
    )
    @with_audit_context(table_name='teachers')
    @transaction.atomic
    def put(self, request, pk):
        uid = request.selected_university_id
        teacher = self.get_teacher_for_university(pk, uid)
        if teacher is None:
            return ApiResponse.not_found()

        sub = {
            k: request.data[k]
            for k in ('name', 'surname', 'last_name', 'require_classroom')
            if k in request.data
        }
        if 'require_classroom' in sub and isinstance(sub['require_classroom'], bool):
            sub['require_classroom'] = 1 if sub['require_classroom'] else 0

        if sub:
            tw = TeacherWriteSerializer(
                teacher,
                data=sub,
                partial=True,
                context={'request': request, 'selected_university_id': uid},
            )
            if not tw.is_valid():
                return ApiResponse.error(errors=tw.errors)
            teacher = tw.save()

        if 'availabilities' in request.data:
            raw_av = request.data['availabilities']
            if raw_av is None:
                raw_av = []
            if not isinstance(raw_av, list):
                return ApiResponse.error(
                    message='availabilities debe ser una lista.',
                    status_code=400,
                )
            av_ser = TeacherAvailabilityInputSerializer(data=raw_av, many=True)
            if not av_ser.is_valid():
                return ApiResponse.error(errors={'availabilities': av_ser.errors})
            replace_teacher_availabilities(teacher, av_ser.validated_data)

        if 'subjects' in request.data:
            raw_sj = request.data['subjects']
            if raw_sj is None:
                raw_sj = []
            if not isinstance(raw_sj, list):
                return ApiResponse.error(
                    message='subjects debe ser una lista.',
                    status_code=400,
                )
            sj_ser = TeacherSubjectRefSerializer(data=raw_sj, many=True)
            if not sj_ser.is_valid():
                return ApiResponse.error(errors={'subjects': sj_ser.errors})
            try:
                replace_teacher_subjects(teacher, uid, sj_ser.validated_data)
            except serializers.ValidationError as exc:
                return ApiResponse.error(errors=exc.detail)

        return ApiResponse.success(
            TeacherFullDetailSerializer(
                teacher,
                context={'selected_university_id': uid},
            ).data,
            message='Profesor actualizado exitosamente',
        )

    @with_audit_context(table_name='teachers_universities')
    @transaction.atomic
    def delete(self, request, pk):
        """Baja del profesor en esta universidad (vínculo lógico), no borra la persona global."""
        uid = request.selected_university_id
        link = (
            TeachersUniversities.objects.filter(
                teachers_id=pk,
                universities_id=uid,
                is_deleted=0,
            ).first()
        )
        if link is None:
            return ApiResponse.not_found()
        link.is_deleted = 1
        link.save(update_fields=['is_deleted'])
        return ApiResponse.deleted(
            'Profesor desvinculado de la universidad correctamente'
        )


@extend_schema(tags=['Teachers'])
class TeacherToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @with_audit_context(table_name='teachers_universities')
    @transaction.atomic
    def put(self, request, pk):
        """Activa/inactiva al profesor en la universidad seleccionada (teachers_universities.status)."""
        uid = request.selected_university_id
        link = (
            TeachersUniversities.objects.filter(
                teachers_id=pk,
                universities_id=uid,
                is_deleted=0,
            ).first()
        )
        if link is None:
            return ApiResponse.not_found()

        link.status = 0 if link.status == 1 else 1
        with with_audit_action('CHANGE_STATUS'):
            link.save(update_fields=['status'])

        estado = 'activado en la universidad' if link.status == 1 else 'desactivado en la universidad'
        teacher = Teachers.objects.filter(pk=pk, is_deleted=0).first()
        if teacher is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            data=TeacherDetailSerializer(
                teacher,
                context={'selected_university_id': uid},
            ).data,
            message=f'Profesor {estado} correctamente',
        )
