import React from 'react';
import PropTypes from 'prop-types';
import { GraduationCap } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

export const CareerDetail = ({
  career,
  periodExceptions = [],
  periodExceptionsLoading = false,
  onClose,
  onEdit,
}) => {
  if (!career) {
    return null;
  }

  const isActive = Number(career.status) === 1;
  const totalPeriodsLabel = career.total_periods ?? '—';

  let periodExceptionsContent = null;
  if (periodExceptionsLoading) {
    periodExceptionsContent = <p className="text-sm text-[var(--text-secondary)]">Cargando excepciones…</p>;
  } else if (periodExceptions.length === 0) {
    periodExceptionsContent = (
      <p className="text-sm italic text-[var(--text-tertiary)]">
        No hay excepciones configuradas
      </p>
    );
  } else {
    periodExceptionsContent = (
      <ul className="space-y-2">
        {periodExceptions.map((ex) => (
          <li key={ex.id} className="text-sm text-[var(--text-primary)]">
            <span className="font-medium">Periodo {ex.period_number}</span>
            {ex.reason ? (
              <span className="text-[var(--text-secondary)]"> — {ex.reason}</span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--accent,#2563eb)]/15 text-[var(--accent,#2563eb)]">
          <GraduationCap size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)] break-words">
            {career.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {[career.code, career.short_name].filter(Boolean).join(' • ') || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Estado
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-[var(--text-primary)]">
              {isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Universidad
          </p>
          <p className="text-sm text-[var(--text-primary)]">{career.university || '—'}</p>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Modalidad
          </p>
          <p className="text-sm text-[var(--text-primary)]">{career.modality || '—'}</p>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Total de periodos
          </p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {totalPeriodsLabel}
          </p>
        </div>
      </div>

      <div>
        <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
          Excepciones de periodos
        </p>
        <div className="min-h-[3rem] rounded-lg border border-dashed border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
          {periodExceptionsContent}
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton label="Cerrar" onClick={onClose} className="flex-1" variant="secondary" />
        <ActionButton label="Editar" variant="primary" onClick={onEdit} className="flex-1" />
      </div>
    </div>
  );
};

CareerDetail.propTypes = {
  career: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    short_name: PropTypes.string,
    code: PropTypes.string,
    university: PropTypes.string,
    modality: PropTypes.string,
    modality_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_periods: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  periodExceptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      period_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      reason: PropTypes.string,
    }),
  ),
  periodExceptionsLoading: PropTypes.bool,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
};
