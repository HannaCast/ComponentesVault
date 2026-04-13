import React from 'react';
import PropTypes from 'prop-types';
import { Users } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

export const GroupDetail = ({
  group,
  onClose,
  onEdit,
}) => {
  if (!group) {
    return null;
  }

  const isActive = Number(group.status) === 1;

  const formatDateTime = (value) => {
    if (!value) return '-';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--accent,#2563eb)]/15 text-[var(--accent,#2563eb)]">
          <Users size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)] break-words">
            {group.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {group.career_name || '—'}
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
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Universidad
          </p>
          <p className="text-sm text-[var(--text-primary)]">{group.university_name || '—'}</p>
        </div>

        <div className="md:col-span-4">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Periodo
          </p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {group.period_number ?? '—'}
          </p>
        </div>

        <div className="md:col-span-4">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Letra
          </p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {group.letter || '—'}
          </p>
        </div>

        <div className="md:col-span-4">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Turno
          </p>
          <p className="text-sm text-[var(--text-primary)]">{group.shift_name || '—'}</p>
        </div>

        {group.academic_period_name ? (
          <div className="md:col-span-12">
            <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Periodo académico
            </p>
            <p className="text-sm text-[var(--text-primary)]">{group.academic_period_name}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Creado el
          </p>
          <p className="text-sm text-[var(--text-primary)]">{formatDateTime(group.created_at)}</p>
        </div>
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Actualizado el
          </p>
          <p className="text-sm text-[var(--text-primary)]">{formatDateTime(group.updated_at)}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton label="Cerrar" onClick={onClose} className="flex-1" variant="secondary" />
        <ActionButton label="Editar" variant="primary" onClick={onEdit} className="flex-1" />
      </div>
    </div>
  );
};

GroupDetail.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    career_name: PropTypes.string,
    period_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    letter: PropTypes.string,
    shift_name: PropTypes.string,
    university_name: PropTypes.string,
    academic_period_name: PropTypes.string,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
};
