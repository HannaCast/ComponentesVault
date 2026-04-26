import PropTypes from 'prop-types';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherAvailabilityErrorModal = ({ isOpen, onClose, teachers }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-availability-modal-title"
    >
      <div
        className="w-full max-w-md rounded-xl border shadow-xl"
        style={{
          backgroundColor: 'var(--bg-elevated, #ffffff)',
          borderColor: 'var(--border-default, #d1d5db)',
        }}
      >
        <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--warning-subtle, #fef3c7)' }}
          >
            <Users className="h-4 w-4" style={{ color: 'var(--warning, #d97706)' }} aria-hidden />
          </span>
          <div>
            <h2
              id="teacher-availability-modal-title"
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary, #111827)' }}
            >
              Profesores sin disponibilidad configurada
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Los siguientes profesores están asignados a materias pero no tienen ningún bloque marcado como disponible.
              Configura su disponibilidad antes de generar el horario.
            </p>
          </div>
        </div>

        <ul className="max-h-56 divide-y overflow-y-auto px-5 py-3" style={{ divideColor: 'var(--border-subtle, #e5e7eb)' }}>
          {teachers.map((t) => (
            <li
              key={t.full_name}
              className="flex items-center gap-2 py-2 text-sm"
              style={{ color: 'var(--text-primary, #111827)' }}
            >
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--warning-subtle, #fef3c7)',
                  color: 'var(--warning, #d97706)',
                }}
              >
                {String(t.full_name || '').charAt(0).toUpperCase()}
              </span>
              <span className="truncate font-medium">{t.full_name}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t px-5 py-4" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <Link
            to="/usuario/universidad/profesores"
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent, #2563eb)' }}
            onClick={onClose}
          >
            Ir a Profesores →
          </Link>
          <button
            type="button"
            id="teacher-availability-modal-close"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-default, #d1d5db)',
              color: 'var(--text-primary, #111827)',
              backgroundColor: 'var(--bg-elevated, #ffffff)',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

TeacherAvailabilityErrorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teachers: PropTypes.arrayOf(
    PropTypes.shape({
      full_name: PropTypes.string,
    })
  ).isRequired,
};
