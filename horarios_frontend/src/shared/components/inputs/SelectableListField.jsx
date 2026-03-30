import React, { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { Select } from '@shared/components/inputs/Select';

export const SelectableListField = ({
  label,
  selectedValues = [],
  options = [],
  selectedOption,
  onSelectedOptionChange,
  onAdd,
  onRemove,
  placeholder = 'Seleccionar...',
  addLabel = 'Agregar',
  disabled = false,
}) => {
  const normalizedOptions = useMemo(() => {
    const baseOptions = Array.isArray(options) ? options : [];
    const selectedAsOptions = selectedValues
      .filter(Boolean)
      .map((value) => ({ value, label: value }));

    const map = new Map();
    [...baseOptions, ...selectedAsOptions].forEach((opt) => {
      if (!opt?.value) return;
      map.set(String(opt.value), {
        value: opt.value,
        label: opt.label || String(opt.value),
      });
    });

    return Array.from(map.values());
  }, [options, selectedValues]);

  const selectedSet = useMemo(
    () => new Set(selectedValues.map((value) => String(value))),
    [selectedValues],
  );

  const availableOptions = normalizedOptions.filter(
    (opt) => !selectedSet.has(String(opt.value)),
  );

  const selectedLabel = useMemo(() => {
    const match = normalizedOptions.find((opt) => String(opt.value) === String(selectedOption));
    return match?.label || String(selectedOption || '');
  }, [normalizedOptions, selectedOption]);

  const canAdd = !disabled && Boolean(selectedOption) && !selectedSet.has(String(selectedOption));

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd?.(selectedOption, selectedLabel);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: 'var(--accent, #2563eb)' }}
        >
          <Plus size={16} />
          {addLabel}
        </button>
      </div>

      <Select
        value={selectedOption}
        onChange={(e) => onSelectedOptionChange?.(e.target.value)}
        options={availableOptions}
        placeholder={placeholder}
        disabled={disabled}
        reserveHelperSpace={false}
      />

      {selectedValues.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedValues.map((value, index) => {
            const item = normalizedOptions.find((opt) => String(opt.value) === String(value));
            const displayLabel = item?.label || String(value);

            return (
              <div
                key={`${String(value)}-${index}`}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <Select
                    value={String(value)}
                    onChange={() => {}}
                    options={[{ value: String(value), label: displayLabel }]}
                    disabled
                    showPlaceholderOption={false}
                    reserveHelperSpace={false}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onRemove?.(index)}
                  disabled={disabled}
                  className="h-10 w-10 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: 'var(--border-default, #d1d5db)',
                    color: 'var(--error, #dc2626)',
                    backgroundColor: 'var(--bg-elevated, #ffffff)',
                  }}
                  aria-label={`Quitar ${displayLabel}`}
                  title={`Quitar ${displayLabel}`}
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
