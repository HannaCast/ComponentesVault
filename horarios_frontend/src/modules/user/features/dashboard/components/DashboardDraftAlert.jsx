import PropTypes from 'prop-types';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

const formatDateTime = (isoDate) => {
  if (!isoDate) {
    return null;
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const DashboardDraftAlert = ({ scheduleGeneration }) => {
  const hasDraft = Boolean(scheduleGeneration?.has_draft);
  const draftLabel = scheduleGeneration?.draft_version_label || 'Borrador activo';
  const formattedDate = formatDateTime(scheduleGeneration?.draft_created_at);

  if (!hasDraft) {
    return (
      <SurfacePanel className="h-full" padding="p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5" style={{ color: '#16a34a' }} aria-hidden />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Sin borradores pendientes
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Puedes generar una nueva version de horario cuando lo necesites.
            </p>
          </div>
        </div>
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel className="h-full" padding="p-5">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5" style={{ color: 'var(--warning, #d97706)' }} aria-hidden />

          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Tienes un borrador pendiente por confirmar
            </p>

            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              {draftLabel}
            </p>

            {formattedDate ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                Creado: {formattedDate}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          to="/usuario/universidad/generar-horario"
          className="inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          style={{
            borderColor: 'var(--border-default, #d1d5db)',
            color: 'var(--text-primary, #111827)',
            backgroundColor: 'var(--bg-elevated, #ffffff)',
          }}
        >
          Revisar borrador
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </SurfacePanel>
  );
};

DashboardDraftAlert.propTypes = {
  scheduleGeneration: PropTypes.shape({
    has_draft: PropTypes.bool,
    draft_version_label: PropTypes.string,
    draft_created_at: PropTypes.string,
  }),
};
