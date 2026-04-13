import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Info, X } from 'lucide-react';

/**
 * Select
 *
 * Props:
 * - id: Identificador HTML del select.
 * - label: Etiqueta mostrada arriba del campo.
 * - error: Mensaje de error para mostrar debajo del campo.
 * - helperText: Texto de ayuda debajo del campo cuando no hay error.
 * - options: Arreglo de opciones [{ value, label, disabled? }].
 * - value: Valor seleccionado actual.
 * - onChange: Callback al cambiar seleccion.
 * - placeholder: Texto de la opcion vacia (por defecto sin texto visible).
 * - required: Marca el campo como requerido visualmente.
 * - disabled: Deshabilita el campo.
 * - className: Clases CSS adicionales del contenedor.
 * - colorVariant: 'user' | 'default' para elegir la paleta de foco.
 * - infoMessage: Mensaje informativo opcional en tooltip.
 * - clearable: Permite limpiar el valor con boton.
 * - showPlaceholderOption: Si true, agrega opcion placeholder dentro del dropdown.
 * - reserveHelperSpace: Si true, reserva espacio inferior cuando no hay error/helper.
 */
export const Select = ({
  id,
  label,
  labelClassName = '',
  labelStyle,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  colorVariant = 'user',
  infoMessage,
  clearable = false,
  showPlaceholderOption = true,
  reserveHelperSpace = true,
  selectClassName = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const selectedLabel = useMemo(() => {
    const match = options.find((opt) => String(opt.value) === String(value));
    if (match) return match.label;
    if (disabled && !value) return '—';
    return placeholder;
  }, [options, value, placeholder, disabled]);

  const handleChange = (event) => {
    onChange?.(event);
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onChange?.({ target: { value: '' } });
  };

  const selectBackgroundColor = error
    ? 'var(--error-subtle, #fef2f2)'
    : 'var(--bg-surface, #f3f4f6)';
  const selectBorderColor = error
    ? 'var(--error, #dc2626)'
    : 'var(--border-default, #d1d5db)';
  const selectTextColor = disabled
    ? 'var(--text-disabled, #94a3b8)'
    : 'var(--text-primary, #111827)';
  const focusAccent = colorVariant === 'default'
    ? 'var(--system-accent, var(--accent, #2563eb))'
    : 'var(--accent, #2563eb)';
  const focusAccentSubtle = colorVariant === 'default'
    ? 'var(--system-accent-subtle, var(--accent-subtle, rgba(37, 99, 235, 0.1)))'
    : 'var(--accent-subtle, rgba(37, 99, 235, 0.1))';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          className={`flex items-center justify-between text-sm font-medium mb-2 ${labelClassName}`}
          style={{ color: 'var(--text-primary, #111827)', ...labelStyle }}
        >
          <span>
            {label}
            {required ? (
              <span className="ml-1" style={{ color: 'var(--error, #dc2626)' }}>
                *
              </span>
            ) : null}
          </span>
          {infoMessage && (
            <div className="relative flex items-center">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="focus:outline-none transition-colors"
                style={{ color: 'var(--text-secondary, #6b7280)' }}
              >
                <Info className="w-4 h-4" />
              </button>
              {showTooltip && (
                <div
                  className="absolute top-6 z-50 w-64 p-3 text-xs rounded-lg shadow-lg right-0"
                  style={{
                    backgroundColor: 'var(--bg-base, #111827)',
                    color: 'var(--text-primary, #f1f5f9)',
                    border: '1px solid var(--border-default, #334155)',
                  }}
                >
                  {infoMessage}
                </div>
              )}
            </div>
          )}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none px-4 py-2.5 pr-12 rounded-lg border text-sm outline-none transition-all duration-200 ${selectClassName}`}
          style={{
            backgroundColor: selectBackgroundColor,
            borderColor: selectBorderColor,
            color: selectTextColor,
          }}
          onFocus={(e) => {
            if (!error && !disabled) {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface, #f3f4f6)';
              e.currentTarget.style.borderColor = focusAccent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${focusAccentSubtle}`;
            }
          }}
          onBlur={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = selectBackgroundColor;
              e.currentTarget.style.borderColor = selectBorderColor;
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {showPlaceholderOption ? (
            <option value="">{placeholder || '\u00A0'}</option>
          ) : null}
          {options.map((option) => (
            <option key={String(option.value)} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {clearable && !disabled && value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-secondary, #6b7280)' }}
            aria-label="Limpiar seleccion"
            title="Limpiar"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <ChevronDown
          className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-secondary, #6b7280)' }}
        />
      </div>

      {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--error, #dc2626)' }}>{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>{helperText}</p>}
      {reserveHelperSpace && !error && !helperText && (
        <p className="mt-1.5 text-xs opacity-0" aria-hidden="true">{selectedLabel}</p>
      )}
    </div>
  );
};

Select.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  labelClassName: PropTypes.string,
  labelStyle: PropTypes.object,
  error: PropTypes.node,
  helperText: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    label: PropTypes.node,
    disabled: PropTypes.bool,
  })),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  colorVariant: PropTypes.oneOf(['user', 'default']),
  infoMessage: PropTypes.node,
  clearable: PropTypes.bool,
  showPlaceholderOption: PropTypes.bool,
  reserveHelperSpace: PropTypes.bool,
  selectClassName: PropTypes.string,
};
