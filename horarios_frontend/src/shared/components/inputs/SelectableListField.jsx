import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Select } from '@shared/components/inputs/Select';

export const SelectableListField = ({
  label,
  selectedValues = [],
  options = [],
  selectedOption,
  onSelectedOptionChange,
  onAdd,
  onUpdate,
  onRemove,
  placeholder = 'Seleccionar...',
  addLabel = 'Agregar',
  disabled = false,
}) => {
  const [isPendingRowVisible, setIsPendingRowVisible] = useState(true);

  const normalizeSelectedEntry = (entry) => {
    if (entry && typeof entry === 'object') {
      const rawValue = entry.value ?? entry.id ?? '';
      const value = String(rawValue || '').trim();
      const label = entry.label ?? entry.name ?? value;

      return value ? { value, label: String(label || value) } : null;
    }

    const value = String(entry || '').trim();
    return value ? { value, label: value } : null;
  };

  const normalizedSelectedEntries = useMemo(
    () => selectedValues.map(normalizeSelectedEntry).filter(Boolean),
    [selectedValues],
  );

  const normalizedOptions = useMemo(() => {
    const baseOptions = Array.isArray(options) ? options : [];
    const selectedAsOptions = normalizedSelectedEntries.map((entry) => ({
      value: entry.value,
      label: entry.label,
    }));

    const map = new Map();
    [...baseOptions, ...selectedAsOptions].forEach((opt) => {
      const rawValue = opt?.value;
      const key = String(rawValue || '').trim();

      if (!key) return;

      map.set(key, {
        value: key,
        label: opt.label || key,
      });
    });

    return Array.from(map.values());
  }, [options, normalizedSelectedEntries]);

  const selectedSet = useMemo(
    () => new Set(normalizedSelectedEntries.map((entry) => String(entry.value))),
    [normalizedSelectedEntries],
  );

  const availableOptions = normalizedOptions.filter(
    (opt) => !selectedSet.has(String(opt.value)),
  );

  const selectedLabel = useMemo(() => {
    const match = normalizedOptions.find((opt) => String(opt.value) === String(selectedOption));
    return match?.label || String(selectedOption || '');
  }, [normalizedOptions, selectedOption]);

  const allRowsSelected = normalizedSelectedEntries.length === selectedValues.length;
  const canConfirmAdd = !disabled
    && isPendingRowVisible
    && allRowsSelected
    && Boolean(selectedOption)
    && !selectedSet.has(String(selectedOption));

  const canShowPendingRow = !disabled
    && !isPendingRowVisible
    && availableOptions.length > 0
    && allRowsSelected;

  const canAdd = canConfirmAdd || canShowPendingRow;
  const canHidePendingSelector = normalizedSelectedEntries.length > 0;

  const handleAdd = () => {
    if (canShowPendingRow) {
      setIsPendingRowVisible(true);
      return;
    }

    if (!canConfirmAdd) return;
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

      {selectedValues.length > 0 && (
        <div className="mt-3 space-y-2">
          {normalizedSelectedEntries.map((entry, index) => {
            const item = normalizedOptions.find((opt) => String(opt.value) === String(entry.value));
            const displayLabel = item?.label || entry.label;
            const usedByOthers = new Set(
              normalizedSelectedEntries
                .filter((_, i) => i !== index)
                .map((e) => String(e.value)),
            );

            const rowOptions = normalizedOptions.filter(
              (opt) => !usedByOthers.has(String(opt.value)) || String(opt.value) === String(entry.value),
            );

            return (
              <div
                key={`${String(entry.value)}-${index}`}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <Select
                    value={String(entry.value)}
                    onChange={(e) => {
                      const nextValue = String(e.target.value || '');
                      const nextItem = normalizedOptions.find((opt) => String(opt.value) === nextValue);
                      onUpdate?.(index, nextValue, nextItem?.label || nextValue);
                    }}
                    options={rowOptions}
                    disabled={disabled}
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

      {isPendingRowVisible && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={selectedOption}
              onChange={(e) => onSelectedOptionChange?.(e.target.value)}
              options={availableOptions}
              placeholder={placeholder}
              disabled={disabled}
              reserveHelperSpace={false}
            />
          </div>

          {canHidePendingSelector && (
            <button
              type="button"
              onClick={() => {
                onSelectedOptionChange?.('');
                setIsPendingRowVisible(false);
              }}
              disabled={disabled}
              className="h-10 w-10 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                color: 'var(--error, #dc2626)',
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
              aria-label="Quitar selector de carrera"
              title="Quitar selector"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
