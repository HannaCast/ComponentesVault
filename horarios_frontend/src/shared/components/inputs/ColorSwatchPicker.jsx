import React from 'react';

/**
 * ColorSwatchPicker
 * Componente para seleccionar un color a través de swatches visuales.
 *
 * Props:
 * - label: Etiqueta del campo.
 * - value: Valor actual (id del color seleccionado).
 * - onChange: Función callback al cambiar selección (recibe evento con target.value).
 * - options: Arreglo de opciones [{ value, label, hex }].
 * - disabled: Deshabilita el selector.
 * - required: Marca el campo como requerido visualmente.
 * - helperText: Texto de ayuda debajo del campo.
 * - className: Clases CSS adicionales para el contenedor.
 */

export const ColorSwatchPicker = ({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  required = false,
  helperText,
  className = '',
}) => {
  const selectedOption = options.find((option) => String(option.value) === String(value));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          {label}
          {required ? <span className="ml-1 text-[var(--error)]">*</span> : null}
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const swatchHex = option.hex || '#9CA3AF';
          const isSelected = String(option.value) === String(value);

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange?.({ target: { value: String(option.value) } })}
              disabled={disabled}
              className={`w-10 h-10 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]'
                  : 'border-[var(--border-default)] hover:border-[var(--text-secondary)]'
              }`}
              style={{ backgroundColor: swatchHex }}
              title={option.label}
              aria-label={`Seleccionar color ${option.label}`}
            />
          );
        })}
      </div>

      {helperText && (
        <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
          {helperText}
          {selectedOption ? ` Seleccionado: ${selectedOption.label}.` : ''}
        </p>
      )}
    </div>
  );
};
