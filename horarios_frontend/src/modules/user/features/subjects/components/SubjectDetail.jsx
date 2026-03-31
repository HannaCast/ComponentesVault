import React from 'react';
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
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Estado
          </label>
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
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Obligatoria
          </label>
          <p className="text-sm text-[var(--text-primary)]">
            {isMandatory ? '✓ Sí' : '✗ No'}
          </p>
        </div>
      </div>

      {/* Descripción */}
      {subject.description && (
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Descripción
          </label>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-elevated)] p-3 rounded-lg">
            {subject.description}
          </p>
        </div>
      )}

      {/* Datos generales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Horas por Semana
          </label>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {subject.hours_per_week || '-'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Color
          </label>
          <p className="text-sm text-[var(--text-primary)]">
            {subject.color || '-'}
          </p>
        </div>
      </div>

      {/* Carreras */}
      {subject.careers && subject.careers.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Carreras
          </label>
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
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Profesores Asignados
          </label>
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

      {/* Auditoría */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Creado el
          </label>
          <p className="text-sm text-[var(--text-primary)]">{formatDateTime(subject.created_at)}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Actualizado el
          </label>
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
