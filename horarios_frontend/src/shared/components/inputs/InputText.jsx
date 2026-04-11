import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';

/**
 * InputText
 *
 * Props:
 * - label: Etiqueta mostrada arriba del campo.
 * - error: Mensaje de error mostrado debajo del campo.
 * - helperText: Texto de ayuda cuando no hay error.
 * - infoMessage: Mensaje opcional para tooltip informativo.
 * - className: Clases CSS adicionales para el input.
 * - type: Tipo de input HTML (text, email, password, etc).
 * - colorVariant: 'user' | 'default' para elegir la paleta de foco.
 * - reserveHelperSpace: Si true, reserva espacio inferior cuando no hay error/helper.
 * - ...props: Props nativas del input (value, onChange, placeholder, required, disabled, etc).
 */
const InputText = forwardRef(
  (
    {
      label,
      error,
      helperText,
      infoMessage,
      labelClassName = '',
      labelStyle,
      className = '',
      type = 'text',
      colorVariant = 'user',
      reserveHelperSpace = false,
      ...props
    },
    ref
  ) => {
    const isBaseDisabled = props.disabled;
    const [showTooltip, setShowTooltip] = useState(false);
    const hasError = Boolean(error);
    const effectivePlaceholder =
      isBaseDisabled && !props.value ? '—' : props.placeholder;
    const inputBackgroundColor = hasError
      ? 'var(--error-subtle, #fef2f2)'
      : 'var(--bg-surface, #f3f4f6)';

    let inputBorderColor = 'var(--border-default, #d1d5db)';
    if (hasError) {
      inputBorderColor = 'var(--error, #dc2626)';
    } else if (isBaseDisabled) {
      inputBorderColor = 'transparent';
    }

    const inputTextColor = isBaseDisabled
      ? 'var(--text-disabled, #94a3b8)'
      : 'var(--text-primary, #111827)';
    const focusAccent = colorVariant === 'default'
      ? 'var(--system-accent, #0f766e)'
      : 'var(--accent, #2563eb)';
    const focusAccentSubtle = colorVariant === 'default'
      ? 'var(--system-accent-subtle, #dff5f2)'
      : 'var(--accent-subtle, rgba(37, 99, 235, 0.1))';

    return (
      <div className="w-full">
        {label && (
          <label
            className={`flex items-center justify-between text-sm font-medium mb-2 ${labelClassName}`}
            style={{ color: 'var(--text-primary, #111827)', ...labelStyle }}
          >
            <span>
              {label}
              {props.required && (
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
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip && (
                  <div
                    className="absolute top-6 z-50 w-64 p-3 text-white text-xs rounded-lg shadow-lg right-0"
                    style={{
                      backgroundColor: 'var(--bg-base, #111827)',
                      color: 'var(--text-primary, #f1f5f9)',
                      border: '1px solid var(--border-default, #334155)',
                    }}
                  >
                    <div
                      className="absolute -top-1 right-2 w-2 h-2 transform rotate-45"
                      style={{
                        backgroundColor: 'var(--bg-base, #111827)',
                        borderTop: '1px solid var(--border-default, #334155)',
                        borderLeft: '1px solid var(--border-default, #334155)',
                      }}
                    ></div>
                    {infoMessage}
                  </div>
                )}
              </div>
            )}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          style={{
            backgroundColor: inputBackgroundColor,
            borderColor: inputBorderColor,
            color: inputTextColor,
          }}
          className={`
            w-full px-4 py-2.5 border rounded-lg text-sm
            transition-all duration-200
            outline-none
            disabled:cursor-not-allowed
            ${className}
          `}
          onFocus={(e) => {
            if (!error && !isBaseDisabled) {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface, #f3f4f6)';
              e.currentTarget.style.borderColor = focusAccent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${focusAccentSubtle}`;
            }
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            if (!isBaseDisabled) {
              e.currentTarget.style.backgroundColor = inputBackgroundColor;
              e.currentTarget.style.borderColor = inputBorderColor;
              e.currentTarget.style.boxShadow = 'none';
            }
            props.onBlur?.(e);
          }}
          {...props}
          placeholder={effectivePlaceholder}
        />
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
        {reserveHelperSpace && !error && !helperText && (
          <p className="mt-1.5 text-xs opacity-0" aria-hidden="true">&nbsp;</p>
        )}
      </div>
    );
  }
);

InputText.displayName = 'InputText';

InputText.propTypes = {
  label: PropTypes.node,
  error: PropTypes.node,
  helperText: PropTypes.node,
  infoMessage: PropTypes.node,
  labelClassName: PropTypes.string,
  labelStyle: PropTypes.object,
  className: PropTypes.string,
  type: PropTypes.string,
  colorVariant: PropTypes.oneOf(['user', 'default']),
  reserveHelperSpace: PropTypes.bool,
};

export default InputText;
