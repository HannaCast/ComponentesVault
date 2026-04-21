import PropTypes from 'prop-types';
import { AlertTriangle, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

const STEP_ITEMS = [
  {
    title: 'Selecciona la universidad y su periodo activo',
    description:
      'Primero define en que universidad vas a trabajar y verifica que tenga un periodo activo.',
    actionLabel: 'Ir a Universidades',
    path: '/usuario/universidades',
  },
  {
    title: 'Configura carreras, materias y grupos activos',
    description:
      'Asegurate de tener carreras, materias y grupos listos para poder armar horarios.',
    actionLabel: 'Ir a Carreras',
    path: '/usuario/universidad/carreras',
  },
  {
    title: 'Completa profesores, disponibilidad y aulas',
    description:
      'Completa horarios de disponibilidad y aulas. Esto ayuda a que haya menos clases pendientes por asignar.',
    actionLabel: 'Ir a Profesores',
    path: '/usuario/universidad/profesores',
  },
  {
    title: 'Genera o actualiza el borrador de horario',
    description:
      'En Generar Horario puedes crear un borrador nuevo o actualizar el que ya tengas.',
    actionLabel: 'Abrir Generar Horario',
    path: '/usuario/universidad/generar-horario',
  },
  {
    title: 'Revisa resultados y confirma la version final',
    description:
      'Revisa el resultado, corrige lo necesario y confirma la version final cuando todo este correcto.',
    actionLabel: 'Revisar versiones',
    path: '/usuario/universidad/generar-horario',
  },
];

const BUSINESS_VALIDATIONS = [
  {
    code: 'No hay universidad seleccionada',
    description: 'Selecciona una universidad en tu perfil de trabajo.',
  },
  {
    code: 'No hay periodo activo',
    description: 'Activa un periodo academico para la universidad seleccionada.',
  },
  {
    code: 'No hay grupos activos',
    description: 'Verifica grupos activos y su relacion con carrera/turno/periodo.',
  },
  {
    code: 'No hay materias listas para asignar',
    description: 'Asegura materias activas con carga horaria semanal mayor a cero.',
  },
];

export const DashboardScheduleSteps = ({ hasSelectedUniversity }) => {
  return (
    <SurfacePanel padding="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
            Pasos para generar horarios
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Guia rapida para preparar tu informacion y generar horarios sin contratiempos.
          </p>
        </div>

        <span
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            borderColor: 'var(--border-default, #d1d5db)',
            color: 'var(--text-secondary, #6b7280)',
            backgroundColor: 'var(--bg-elevated, #ffffff)',
          }}
        >
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          5 pasos clave
        </span>
      </div>


      <ol className="mt-4 space-y-2">
        {STEP_ITEMS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-lg border px-3 py-3"
            style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
          >
            <div className="flex items-start gap-3">
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  color: 'var(--accent, #2563eb)',
                  backgroundColor: 'var(--accent-subtle, #eff6ff)',
                }}
              >
                {index + 1}
              </span>

              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  {step.description}
                </p>
                <Link
                  to={step.path}
                  className="mt-2 inline-flex text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--accent, #2563eb)' }}
                >
                  {step.actionLabel}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div
        className="mt-4 rounded-lg border px-4 py-3"
        style={{
          borderColor: 'var(--border-subtle, #e5e7eb)',
          backgroundColor: 'var(--bg-elevated, #ffffff)',
        }}
      >
        <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
          <AlertTriangle className="h-4 w-4" style={{ color: 'var(--warning, #d97706)' }} aria-hidden />
          Mensajes que pueden impedir la generacion
        </p>

        <ul className="mt-3 space-y-2">
          {BUSINESS_VALIDATIONS.map((item) => (
            <li key={item.code} className="flex flex-wrap items-start gap-2 text-xs">
              <span
                className="rounded-full border px-2 py-0.5 font-semibold"
                style={{
                  borderColor: 'var(--border-default, #d1d5db)',
                  color: 'var(--text-secondary, #6b7280)',
                  backgroundColor: 'var(--bg-surface, #f9fafb)',
                }}
              >
                {item.code}
              </span>
              <span style={{ color: 'var(--text-secondary, #6b7280)' }}>{item.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </SurfacePanel>
  );
};

DashboardScheduleSteps.propTypes = {
  hasSelectedUniversity: PropTypes.bool,
};

DashboardScheduleSteps.defaultProps = {
  hasSelectedUniversity: true,
};
