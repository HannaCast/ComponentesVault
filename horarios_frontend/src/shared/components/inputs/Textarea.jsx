import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Textarea
 *
 * Props:
 * - label: Etiqueta mostrada arriba del campo.
 * - error: Mensaje de error mostrado debajo del campo.
 * - helperText: Texto de ayuda cuando no hay error.
 * - infoMessage: Mensaje opcional para tooltip informativo.
 * - reserveHelperSpace: Si true, reserva espacio inferior cuando no hay error/helper.
 * - className: Clases CSS adicionales para el textarea.
 * - colorVariant: 'user' | 'default' para elegir la paleta de foco.
 * - ...props: Props nativas del textarea (value, onChange, placeholder, rows, required, disabled, etc).
 */
const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      infoMessage,
      className = '',
      colorVariant = 'user',
      reserveHelperSpace = false,
      ...props
    },
    ref,
  ) => {
    const isBaseDisabled = props.disabled;
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef(null);
    const hasError = Boolean(error);
    const textareaBackgroundColor = hasError
      ? 'var(--error-subtle, #fef2f2)'
      : 'var(--bg-surface, #f3f4f6)';

    let textareaBorderColor = 'var(--border-default, #d1d5db)';
    if (hasError) {
      textareaBorderColor = 'var(--error, #dc2626)';
    } else if (isBaseDisabled) {
      textareaBorderColor = 'transparent';
    }

    const textareaTextColor = isBaseDisabled
      ? 'var(--text-disabled, #94a3b8)'
      : 'var(--text-primary, #111827)';
    const focusAccent = colorVariant === 'default'
      ? 'var(--system-accent, var(--accent, #2563eb))'
      : 'var(--accent, #2563eb)';
    const focusAccentSubtle = colorVariant === 'default'
      ? 'var(--system-accent-subtle, var(--accent-subtle, rgba(37, 99, 235, 0.1)))'
      : 'var(--accent-subtle, rgba(37, 99, 235, 0.1))';

    useEffect(() => {
      if (!showTooltip) {
        return undefined;
      }

      const handleClickOutside = (event) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
          setShowTooltip(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTooltip]);

    return (
      <div className="w-full">
        {label && (
          <label
            className="flex items-center justify-between text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary, #111827)' }}
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
              <div className="relative flex items-center" ref={tooltipRef}>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip((prev) => !prev)}
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

        <textarea
          ref={ref}
          style={{
            backgroundColor: textareaBackgroundColor,
            borderColor: textareaBorderColor,
            color: textareaTextColor,
          }}
          className={`
            w-full px-4 py-2.5 border rounded-lg text-sm
            transition-all duration-200
            outline-none
            disabled:cursor-not-allowed
            resize-none
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
              e.currentTarget.style.backgroundColor = textareaBackgroundColor;
              e.currentTarget.style.borderColor = textareaBorderColor;
              e.currentTarget.style.boxShadow = 'none';
            }
            props.onBlur?.(e);
          }}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--error, #dc2626)' }}>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            {helperText}
          </p>
        )}

        {reserveHelperSpace && !error && !helperText && (
          <p className="mt-1.5 text-xs opacity-0" aria-hidden="true">&nbsp;</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';


export default Textarea;
