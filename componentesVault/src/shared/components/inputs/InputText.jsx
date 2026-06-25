import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Info } from 'lucide-react';
import { renderIcon } from '../components/vault-utils.js';

const resolveEffectiveInputType = ({ canTogglePassword, isPasswordVisible, type }) => {
  if (!canTogglePassword) {
    return type;
  }

  return isPasswordVisible ? 'text' : 'password';
};

const resolveInputBorderColor = ({ hasError, isBaseDisabled }) => {
  if (hasError) {
    return 'var(--error, #dc2626)';
  }

  if (isBaseDisabled) {
    return 'transparent';
  }

  return 'var(--border-default, #d1d5db)';
};

const resolveInputTextColor = (isBaseDisabled) => {
  if (isBaseDisabled) {
    return 'var(--text-disabled, #94a3b8)';
  }

  return 'var(--text-primary, #111827)';
};

const InputText = forwardRef(
  (
    {
      label,
      icon,
      error,
      helperText,
      infoMessage,
      labelClassName = '',
      labelStyle,
      className = '',
      inputClassName = '',
      type = 'text',
      required = false,
      enablePasswordToggle = false,
      colorVariant = 'user',
      reserveHelperSpace = false,
      ...props
    },
    ref
  ) => {
    const isBaseDisabled = props.disabled;
    const [showTooltip, setShowTooltip] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const hasError = Boolean(error);
    const canTogglePassword = type === 'password' && enablePasswordToggle;
    const effectiveInputType = resolveEffectiveInputType({
      canTogglePassword,
      isPasswordVisible,
      type,
    });
    const effectivePlaceholder = isBaseDisabled && !props.value ? '—' : props.placeholder;
    const inputBackgroundColor = hasError
      ? 'var(--error-subtle, #fef2f2)'
      : 'var(--bg-surface, #f3f4f6)';
    const inputBorderColor = resolveInputBorderColor({ hasError, isBaseDisabled });
    const inputTextColor = resolveInputTextColor(isBaseDisabled);
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
                  onClick={() => setShowTooltip(!showTooltip)}
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
          <input
            ref={ref}
            type={effectiveInputType}
            style={{
              backgroundColor: inputBackgroundColor,
              borderColor: inputBorderColor,
              color: inputTextColor,
            }}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed ${icon ? 'pl-10' : ''} ${canTogglePassword ? 'pr-11' : ''} ${inputClassName}`}
            onFocus={(event) => {
              if (!error && !isBaseDisabled) {
                event.currentTarget.style.backgroundColor = 'var(--bg-surface, #f3f4f6)';
                event.currentTarget.style.borderColor = focusAccent;
                event.currentTarget.style.boxShadow = `0 0 0 3px ${focusAccentSubtle}`;
              }
              props.onFocus?.(event);
            }}
            onBlur={(event) => {
              if (!isBaseDisabled) {
                event.currentTarget.style.backgroundColor = inputBackgroundColor;
                event.currentTarget.style.borderColor = inputBorderColor;
                event.currentTarget.style.boxShadow = 'none';
              }
              props.onBlur?.(event);
            }}
            {...props}
            required={required}
            placeholder={effectivePlaceholder}
          />

          {icon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-secondary, #6b7280)]">
              {renderIcon(icon, { className: 'h-4 w-4' })}
            </span>
          ) : null}

          {canTogglePassword && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible((current) => !current)}
              className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md"
              style={{ color: 'var(--text-secondary, #6b7280)' }}
              aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>

        {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--error, #dc2626)' }}>{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>{helperText}</p>}
        {reserveHelperSpace && !error && !helperText && <p className="mt-1.5 text-xs opacity-0" aria-hidden="true">&nbsp;</p>}
      </div>
    );
  }
);

InputText.displayName = 'InputText';

InputText.propTypes = {
  label: PropTypes.node,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  error: PropTypes.node,
  helperText: PropTypes.node,
  infoMessage: PropTypes.node,
  labelClassName: PropTypes.string,
  labelStyle: PropTypes.object,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
  enablePasswordToggle: PropTypes.bool,
  colorVariant: PropTypes.oneOf(['user', 'default']),
  reserveHelperSpace: PropTypes.bool,
};

export { InputText };
export { InputText as VaultTextField };
export default InputText;