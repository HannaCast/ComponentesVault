from dataclasses import asdict

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from schedule_generator.services import generate_schedule


@extend_schema(tags=['Schedule generator'])
class ScheduleGeneratorView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def post(self, request):
        """Genera un horario en memoria para la universidad seleccionada del usuario."""
        selected_university_id = request.selected_university_id

        try:
            # El servicio aplica todo el pipeline de carga -> grafo -> DSatur -> formatter.
            result = generate_schedule(
                university_id=selected_university_id,
                force_uses_period_groups_false=True,
            )
            return ApiResponse.success(
                data=asdict(result),
                message='Horario generado exitosamente.',
            )
        except ValueError as exc:
            # Se traduce el codigo de negocio a mensaje legible para el cliente.
            error_code = str(exc)
            messages = {
                'NO_UNIVERSITY_SELECTED': 'No hay universidad seleccionada para generar el horario.',
                'UNIVERSITY_NOT_FOUND': 'La universidad seleccionada no existe o esta inactiva.',
                'NO_ACTIVE_GROUPS': 'No hay grupos activos para generar horario en esta universidad.',
                'NO_SCHEDULABLE_SUBJECTS': 'No hay materias u horarios base disponibles para generar un horario.',
                'NO_ACTIVE_PERIOD': 'No hay periodo academico activo configurado.',
            }
            return ApiResponse.error(
                message=messages.get(error_code, error_code),
                status_code=422,
            )
