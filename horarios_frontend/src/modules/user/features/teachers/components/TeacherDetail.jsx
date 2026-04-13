import React from 'react';
import PropTypes from 'prop-types';
import { UserCheck } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { dayOfWeekLabel } from '../utils/teacherAvailabilityUtils';

export const TeacherDetail = ({
  teacher,
  onClose,
  onEdit,
}) => {
  if (!teacher) {
    return null;
  }

  const hasUniversityLinkStatus = teacher.university_link_status != null;
  const isActive = hasUniversityLinkStatus
    ? Number(teacher.university_link_status) === 1
    : Number(teacher.status) === 1;
  const displayName = teacher.full_name
    || [teacher.name, teacher.surname, teacher.last_name].filter(Boolean).join(' ');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent)]"
        >
          <UserCheck size={32} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {displayName}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {teacher.require_classroom_display || '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Nombre
          </p>
          <p className="text-sm text-[var(--text-primary)]">{teacher.name || '-'}</p>
        </div>
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Apellido paterno
          </p>
          <p className="text-sm text-[var(--text-primary)]">{teacher.surname || '-'}</p>
        </div>
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Apellido materno
          </p>
          <p className="text-sm text-[var(--text-primary)]">{teacher.last_name || '—'}</p>
        </div>
        <div>
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
      </div>

      <div>
        <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
          Disponibilidad horaria
        </p>
        {Array.isArray(teacher.availabilities) && teacher.availabilities.length > 0 ? (
          <ul className="space-y-2">
            {teacher.availabilities.map((a) => (
              <li
                key={a.id ?? `${a.day_of_week}-${a.start_time}-${a.end_time}`}
                className="text-sm text-[var(--text-primary)] rounded-md border border-[var(--border-default)] px-3 py-2"
              >
                <span className="font-medium">{dayOfWeekLabel(a.day_of_week)}</span>
                {' · '}
                {a.start_time != null && a.end_time != null
                  ? `${String(a.start_time).slice(0, 5)} – ${String(a.end_time).slice(0, 5)}`
                  : '—'}
                {' · '}
                {Number(a.is_available) === 1 ? 'Disponible' : 'No disponible'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Sin intervalos registrados.</p>
        )}
      </div>

      <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton
          label="Cerrar"
          onClick={onClose}
          className="flex-1"
        />
        <ActionButton
          label="Editar"
          variant="primary"
          onClick={onEdit}
          className="flex-1"
        />
      </div>
    </div>
  );
};

TeacherDetail.propTypes = {
  teacher: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    surname: PropTypes.string,
    last_name: PropTypes.string,
    full_name: PropTypes.string,
    require_classroom_display: PropTypes.string,
    university_link_status: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    availabilities: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        day_of_week: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        start_time: PropTypes.string,
        end_time: PropTypes.string,
        is_available: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
      }),
    ),
  }),
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
};
