import React from 'react';
import PropTypes from 'prop-types';
import { Building2 } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

export const ClassroomDetail = ({
  classroom,
  classroomCareers = [],
  classroomCareersLoading = false,
  onClose,
  onEdit,
}) => {
  if (!classroom) {
    return null;
  }

  const isActive = Number(classroom.status) === 1;
  const isRestricted = Number(classroom.is_restricted) === 1;
  const isRestrictedToSubjects = Number(classroom.is_restricted_to_subjects) === 1;
  const restrictedSubjects = Array.isArray(classroom.subjects) ? classroom.subjects : [];

  const renderCareerAccessContent = () => {
    if (classroomCareersLoading) {
      return <p className="text-sm text-[var(--text-secondary)]">Cargando carreras…</p>;
    }

    if (classroomCareers.length === 0) {
      return <p className="text-sm italic text-[var(--text-tertiary)]">No hay carreras asignadas</p>;
    }

    return (
      <ul className="flex flex-wrap gap-2">
        {classroomCareers.map((row) => (
          <li
            key={row.id}
            className="px-3 py-1 text-xs font-medium rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          >
            {row.career_name || '—'}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--accent,#2563eb)]/15 text-[var(--accent,#2563eb)]">
          <Building2 size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)] break-words">
            {classroom.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {classroom.classroom_type || '—'}
            {classroom.code ? ` · ${classroom.code}` : ''}
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
          <p className="text-sm text-[var(--text-primary)]">{classroom.university_name || '—'}</p>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Código
          </p>
          <p className="text-sm text-[var(--text-primary)]">{classroom.code || '—'}</p>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Número de piso
          </p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {classroom.floor ?? '—'}
          </p>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Edificio
          </p>
          <p className="text-sm text-[var(--text-primary)]">{classroom.building || '—'}</p>
        </div>

        <div className="md:col-span-6">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Código del edificio
          </p>
          <p className="text-sm text-[var(--text-primary)]">{classroom.building_code || '—'}</p>
        </div>

        <div className="md:col-span-12">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Restringida a carreras específicas
          </p>
          <p className="text-sm text-[var(--text-primary)]">{isRestricted ? 'Sí' : 'No'}</p>
        </div>

        <div className="md:col-span-12">
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Restringida a materias específicas
          </p>
          <p className="text-sm text-[var(--text-primary)]">{isRestrictedToSubjects ? 'Sí' : 'No'}</p>
        </div>

        {isRestricted && (
          <div className="md:col-span-12">
            <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
              Carreras con acceso
            </p>
            <div className="border border-dashed border-[var(--border-default)] rounded-lg p-3 bg-[var(--bg-surface)] min-h-[2.5rem]">
              {renderCareerAccessContent()}
            </div>
          </div>
        )}

        {isRestrictedToSubjects && (
          <div className="md:col-span-12">
            <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
              Materias permitidas
            </p>
            <div className="border border-dashed border-[var(--border-default)] rounded-lg p-3 bg-[var(--bg-surface)] min-h-[2.5rem]">
              {restrictedSubjects.length === 0 ? (
                <p className="text-sm italic text-[var(--text-tertiary)]">
                  No hay materias asignadas
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {restrictedSubjects.map((row) => (
                    <li
                      key={row.id}
                      className="px-3 py-1 text-xs font-medium rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    >
                      {row.code ? `${row.name} (${row.code})` : row.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton label="Cerrar" onClick={onClose} className="flex-1" variant="secondary" />
        <ActionButton label="Editar" variant="primary" onClick={onEdit} className="flex-1" />
      </div>
    </div>
  );
};

ClassroomDetail.propTypes = {
  classroom: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    code: PropTypes.string,
    floor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    building: PropTypes.string,
    building_code: PropTypes.string,
    classroom_type: PropTypes.string,
    university_name: PropTypes.string,
    is_restricted: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_restricted_to_subjects: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        code: PropTypes.string,
      }),
    ),
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  classroomCareers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      career_name: PropTypes.string,
    }),
  ),
  classroomCareersLoading: PropTypes.bool,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
};
