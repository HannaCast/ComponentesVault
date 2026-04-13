import React, { forwardRef, useId, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Checkbox
 *
 * Props:
 * - label: Etiqueta mostrada al lado del checkbox.
 * - checked: Estado booleano del checkbox.
 * - onChange: Callback al cambiar el estado (recibe evento sintético).
 * - error: Mensaje de error mostrado debajo.
 * - helperText: Texto de ayuda cuando no hay error.
 * - infoMessage: Mensaje opcional para tooltip informativo.
 * - disabled: Deshabilita el checkbox.
 * - required: Marca el campo como requerido (asterisco en label).
 * - colorVariant: 'user' | 'default' para elegir la paleta del check.
 * - className: Clases CSS adicionales para el contenedor.
 * - id: Identificador HTML.
 * - ...props: Props nativas del input (name, etc).
 */
const Checkbox = forwardRef(
  (
    {
      label,
      checked = false,
      onChange,
      error,
      helperText,
      infoMessage,
      disabled = false,
      required = false,
      colorVariant = 'user',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;
    const accentColor = colorVariant === 'default'
      ? 'var(--system-accent, var(--accent, #2563eb))'
      : 'var(--accent, #2563eb)';

    let checkboxBorderColor = 'var(--border-default, #d1d5db)';
    if (error) {
      checkboxBorderColor = 'var(--error, #dc2626)';
    } else if (checked) {
      checkboxBorderColor = accentColor;
    }

    const checkboxBackgroundColor = checked
      ? accentColor
      : 'var(--bg-surface, #f3f4f6)';

    const handleChange = (e) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex items-center pt-1">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              onChange={handleChange}
              disabled={disabled}
              className="w-5 h-5 rounded border-2 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: checkboxBorderColor,
                backgroundColor: checkboxBackgroundColor,
                accentColor,
              }}
              {...props}
            />
          </div>

          <div className="flex-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none"
                style={{
                  color: disabled
                    ? 'var(--text-disabled, #94a3b8)'
                    : 'var(--text-primary, #111827)',
                }}
              >
                <span>
                  {label}
                  {required && (
                    <span style={{ color: 'var(--error, #dc2626)' }} className="ml-1">
                      *
                    </span>
                  )}
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
                      disabled={disabled}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {showTooltip && (
                      <div
                        className="absolute top-6 z-50 w-64 p-3 text-xs rounded-lg shadow-lg left-0 right-0"
                        style={{
                          backgroundColor: 'var(--bg-base, #111827)',
                          color: 'var(--text-primary, #f1f5f9)',
                          border: '1px solid var(--border-default, #334155)',
                        }}
                      >
                        <div
                          className="absolute -top-1 left-3 w-2 h-2 transform rotate-45"
                          style={{
                            backgroundColor: 'var(--bg-base, #111827)',
                            borderTop: '1px solid var(--border-default, #334155)',
                            borderLeft: '1px solid var(--border-default, #334155)',
                          }}
                        />
                        {infoMessage}
                      </div>
                    )}
                  </div>
                )}
              </label>
            )}

            {error && (
              <p
                className="mt-1.5 text-xs"
                style={{ color: 'var(--error, #dc2626)' }}
              >
                {error}
              </p>
            )}
            {helperText && !error && (
              <p
                className="mt-1.5 text-xs"
                style={{ color: 'var(--text-secondary, #6b7280)' }}
              >
                {helperText}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
