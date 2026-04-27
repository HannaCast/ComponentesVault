import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionButton } from '@shared/components/inputs/ActionButton';

export const TeacherAvailabilityErrorModal = ({ isOpen, onClose, teachers }) => {
  if (!isOpen) return null;

  const handleCloseOnlyModal = (event) => {
    event?.stopPropagation();
    onClose?.();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-availability-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45 border-0 p-0 cursor-default"
        onClick={handleCloseOnlyModal}
        aria-label="Cerrar modal"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl shadow-xl flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated, #ffffff)',
          border: '1px solid var(--border-default, #d1d5db)',
        }}
      >
        {/* Header */}
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
              Profesores sin disponibilidad
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Los siguientes profesores están asignados a materias pero no tienen ningún bloque marcado como disponible.
            </p>
          </div>
        </div>

        {/* Body (Lista) */}
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

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-5 py-4" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <Link
            to="/usuario/universidad/profesores"
            className="text-sm font-medium transition-opacity hover:opacity-80 flex items-center gap-1.5 order-2 sm:order-1"
            style={{ color: 'var(--accent, #2563eb)' }}
            onClick={onClose}
          >
            Ir a Profesores <ArrowRight className="w-4 h-4" />
          </Link>
          
          <div className="w-full sm:w-auto order-1 sm:order-2">
            <ActionButton
              label="Entendido"
              variant="primary"
              onClick={handleCloseOnlyModal}
              fullWidth={true}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
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
