import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Info, X } from 'lucide-react';

export function Select({
  id,
  label,
  labelClassName = '',
  labelStyle,
  error,
  helperText,
  options = [],
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
  ...props
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? { value: option, label: option } : option
  ));

  const selectedLabel = useMemo(() => {
    const match = normalizedOptions.find((option) => String(option.value) === String(value));
    if (match) return match.label;
    if (disabled && !value) return '—';
    return placeholder;
  }, [normalizedOptions, value, placeholder, disabled]);

  const handleChange = (event) => {
    onChange?.(event);
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onChange?.({ target: { value: '' } });
  };

  const selectBackgroundColor = error ? 'var(--error-subtle, #fef2f2)' : 'var(--bg-surface, #f3f4f6)';
  const selectBorderColor = error ? 'var(--error, #dc2626)' : 'var(--border-default, #d1d5db)';
  const selectTextColor = disabled ? 'var(--text-disabled, #94a3b8)' : 'var(--text-primary, #111827)';
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
          className={`mb-2 flex items-center justify-between text-sm font-medium ${labelClassName}`}
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
                onClick={() => setShowTooltip((current) => !current)}
                className="transition-colors focus:outline-none"
                style={{ color: 'var(--text-secondary, #6b7280)' }}
              >
                <Info className="h-4 w-4" />
              </button>
              {showTooltip && (
                <div
                  className="absolute right-0 top-6 z-50 w-64 rounded-lg border p-3 text-xs shadow-lg"
                  style={{
                    backgroundColor: 'var(--bg-base, #111827)',
                    color: 'var(--text-primary, #f1f5f9)',
                    border: '1px solid var(--border-default, #334155)',
                  }}
                >
                  <div
                    className="absolute -top-1 right-2 h-2 w-2 rotate-45"
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

      <div className="relative">
        <select
          id={id}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none rounded-lg border px-4 py-2.5 pr-12 text-sm outline-none transition-all duration-200 ${selectClassName}`}
          style={{
            backgroundColor: selectBackgroundColor,
            borderColor: selectBorderColor,
            color: selectTextColor,
          }}
          onFocus={(event) => {
            if (!error && !disabled) {
              event.currentTarget.style.backgroundColor = 'var(--bg-surface, #f3f4f6)';
              event.currentTarget.style.borderColor = focusAccent;
              event.currentTarget.style.boxShadow = `0 0 0 3px ${focusAccentSubtle}`;
            }
          }}
          onBlur={(event) => {
            if (!disabled) {
              event.currentTarget.style.backgroundColor = selectBackgroundColor;
              event.currentTarget.style.borderColor = selectBorderColor;
              event.currentTarget.style.boxShadow = 'none';
            }
          }}
          {...props}
        >
          {showPlaceholderOption ? <option value="">{placeholder || '\u00A0'}</option> : null}
          {normalizedOptions.map((option) => (
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
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
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
}

Select.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  labelClassName: PropTypes.string,
  labelStyle: PropTypes.object,
  error: PropTypes.node,
  helperText: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool,
    }),
  ])),
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

export default Select;