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

  return (
    <div className="space-y-6 p-6">
      {/* Header con color y nombre */}
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: subject.color }}
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
                subject.is_active ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-[var(--text-primary)]">
              {subject.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Obligatoria
          </label>
          <p className="text-sm text-[var(--text-primary)]">
            {subject.is_mandatory ? '✓ Sí' : '✗ No'}
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

      {/* Horas por Semana */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
            Horas por Semana
          </label>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {subject.hours_per_week || '-'}
          </p>
        </div>

        {/* Créditos (si existe) */}
        {subject.created_at && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Fecha de Creación
            </label>
            <p className="text-sm text-[var(--text-primary)]">
              {new Date(subject.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
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
                key={index}
                className="px-3 py-1 text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full text-[var(--text-primary)]"
              >
                {career}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Profesores */}
      {subject.professors && subject.professors.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Profesores Asignados
          </label>
          <div className="flex flex-wrap gap-2">
            {subject.professors.map((professor, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-[var(--accent)]/10 border border-[var(--accent)] rounded-full text-[var(--accent)]"
              >
                {professor}
              </span>
            ))}
          </div>
        </div>
      )}

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
