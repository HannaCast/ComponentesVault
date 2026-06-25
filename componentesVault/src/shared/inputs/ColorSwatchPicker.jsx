import PropTypes from 'prop-types';

const defaultSwatches = ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export function ColorSwatchPicker({
  label,
  value,
  onChange,
  options = [],
  colors = defaultSwatches,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
}) {
  const swatches = options.length > 0 ? options : colors.map((color) => ({ value: color, label: color, hex: color }));
  const selectedOption = swatches.find((option) => String(option.value) === String(value));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required ? <span className="ml-1 text-[var(--error)]">*</span> : null}
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        {swatches.map((option) => {
          const swatchHex = option.hex || option.value || '#9CA3AF';
          const isSelected = String(option.value) === String(value);

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange?.({ target: { value: String(option.value) } })}
              disabled={disabled}
              className={`h-10 w-10 rounded-lg border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'scale-110 border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border-default)] hover:border-[var(--text-secondary)]'}`}
              style={{ backgroundColor: swatchHex }}
              title={option.label}
              aria-label={`Seleccionar color ${option.label}`}
            />
          );
        })}
      </div>

      {helperText && !error && (
        <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
          {helperText}
          {selectedOption ? ` Seleccionado: ${selectedOption.label}.` : ''}
        </p>
      )}

      {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--error, #dc2626)' }}>{error}</p>}
    </div>
  );
}

ColorSwatchPicker.propTypes = {
  label: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    hex: PropTypes.string,
  })),
  colors: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.node,
  helperText: PropTypes.node,
  className: PropTypes.string,
};