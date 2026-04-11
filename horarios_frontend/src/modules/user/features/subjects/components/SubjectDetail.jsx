import React from 'react';
import PropTypes from 'prop-types';
import { BookOpen } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

export const SubjectDetail = ({
  subject,
  onClose,
  onEdit,
}) => {
  if (!subject) {
    return null;
  }

  const isActive = Number(subject.status) === 1;
  const isMandatory = Number(subject.is_mandatory) === 1 || subject.is_mandatory === true;
  const hasRestrictedClassroomTypes = (
    Number(subject.is_restricted_to_classroom_types) === 1
    || subject.is_restricted_to_classroom_types === true
  );

  const formatDateTime = (value) => {
    if (!value) return '-';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleString();
  };

  const resolveColorHex = () => {
    const rawHex = String(subject.color_hex || subject.color || '').trim();
    if (!rawHex) return 'var(--bg-muted, #e5e7eb)';

    if (rawHex.startsWith('#')) {
      return rawHex;
    }

    if (/^[0-9a-fA-F]{6}$/.test(rawHex)) {
      return `#${rawHex}`;
    }

    return 'var(--bg-muted, #e5e7eb)';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header con color y nombre */}
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: resolveColorHex() }}
        >
          <BookOpen size={32} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {subject.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {subject.code} • {subject.short_name}
          </p>
        </div>
      </div>

      {/* Estado y Obligatoria */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Estado
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isActive ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-[var(--text-primary)]">
              {isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Obligatoria
          </p>
          <p className="text-sm text-[var(--text-primary)]">
            {isMandatory ? '✓ Sí' : '✗ No'}
          </p>
        </div>
      </div>

      {/* Descripción */}
      {subject.description && (
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Descripción
          </p>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-elevated)] p-3 rounded-lg">
            {subject.description}
          </p>
        </div>
      )}

      {/* Datos generales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Horas por Semana
          </p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {subject.hours_per_week || '-'}
          </p>
        </div>

        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Color
          </p>
          <p className="text-sm text-[var(--text-primary)]">
            {subject.color || '-'}
          </p>
        </div>
      </div>

      {/* Carreras */}
      {subject.careers && subject.careers.length > 0 && (
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Carreras
          </p>
          <div className="flex flex-wrap gap-2">
            {subject.careers.map((career, index) => (
              <span
                key={career.id ?? index}
                className="px-3 py-1 text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full text-[var(--text-primary)]"
              >
                {career?.name || '-'}
                {career?.period_number ? ` (Periodo ${career.period_number})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Profesores */}
      {subject.teachers && subject.teachers.length > 0 && (
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Profesores Asignados
          </p>
          <div className="flex flex-wrap gap-2">
            {subject.teachers.map((professor, index) => (
              <span
                key={professor?.id ?? index}
                className="px-3 py-1 text-xs font-medium bg-[var(--accent)]/10 border border-[var(--accent)] rounded-full text-[var(--accent)]"
              >
                {professor?.full_name || professor?.name || '-'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tipos de aula */}
      <div>
        <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
          Tipos de Aula Permitidos
        </p>

        {hasRestrictedClassroomTypes && Array.isArray(subject.classroom_types) && subject.classroom_types.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subject.classroom_types.map((classroomType, index) => (
              <span
                key={classroomType?.id ?? index}
                className="px-3 py-1 text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full text-[var(--text-primary)]"
              >
                {classroomType?.name || '-'}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Sin restricción por tipo de aula</p>
        )}
      </div>

      {/* Auditoría */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Creado el
          </p>
          <p className="text-sm text-[var(--text-primary)]">{formatDateTime(subject.created_at)}</p>
        </div>
        <div>
          <p className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Actualizado el
          </p>
          <p className="text-sm text-[var(--text-primary)]">{formatDateTime(subject.updated_at)}</p>
        </div>
      </div>

      {/* Botones de Acción */}
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

SubjectDetail.propTypes = {
  subject: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    short_name: PropTypes.string,
    code: PropTypes.string,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    is_mandatory: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    is_restricted_to_classroom_types: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    description: PropTypes.string,
    hours_per_week: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    color: PropTypes.string,
    color_hex: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
    careers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      period_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })),
    teachers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      full_name: PropTypes.string,
      name: PropTypes.string,
    })),
    classroom_types: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })),
  }),
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
};
