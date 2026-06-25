import React, { forwardRef, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';

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

    const handleChange = (event) => {
      onChange?.(event);
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
              className="h-5 w-5 cursor-pointer rounded border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium"
                style={{
                  color: disabled
                    ? 'var(--text-disabled, #94a3b8)'
                    : 'var(--text-primary, #111827)',
                }}
              >
                <span>
                  {label}
                  {required && <span style={{ color: 'var(--error, #dc2626)' }} className="ml-1">*</span>}
                </span>
                {infoMessage && (
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onClick={() => setShowTooltip((current) => !current)}
                      className="transition-colors focus:outline-none"
                      style={{ color: 'var(--text-secondary, #6b7280)' }}
                      disabled={disabled}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    {showTooltip && (
                      <div
                        className="absolute left-0 right-0 top-6 z-50 w-64 rounded-lg border p-3 text-xs shadow-lg"
                        style={{
                          backgroundColor: 'var(--bg-base, #111827)',
                          color: 'var(--text-primary, #f1f5f9)',
                          border: '1px solid var(--border-default, #334155)',
                        }}
                      >
                        <div
                          className="absolute left-3 -top-1 h-2 w-2 rotate-45"
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

            {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--error, #dc2626)' }}>{error}</p>}
            {helperText && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>{helperText}</p>}
          </div>
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  label: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  error: PropTypes.node,
  helperText: PropTypes.node,
  infoMessage: PropTypes.node,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  colorVariant: PropTypes.oneOf(['user', 'default']),
  className: PropTypes.string,
  id: PropTypes.string,
};

export default Checkbox;