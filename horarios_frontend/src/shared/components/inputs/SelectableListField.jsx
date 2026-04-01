import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, X } from 'lucide-react';
import { Select } from '@shared/components/inputs/Select';
import Input from '@shared/components/inputs/InputText';

export const SelectableListField = ({
  label,
  error,
  selectedValues = [],
  options = [],
  selectedOption,
  selectedSecondaryOption = '',
  onSelectedOptionChange,
  onSelectedSecondaryOptionChange,
  onAdd,
  onUpdate,
  onRemove,
  placeholder = 'Seleccionar...',
  addLabel = 'Agregar',
  disabled = false,
  enableSecondaryField = false,
  primaryLabel = 'Elemento',
  secondaryLabel = 'Detalle',
  secondaryPlaceholder = 'Ej: 1',
  secondaryType = 'number',
  secondaryMin,
  secondaryMax,
}) => {
  const [isPendingRowVisible, setIsPendingRowVisible] = useState(true);

  const normalizeSelectedEntry = (entry) => {
    if (entry && typeof entry === 'object') {
      const rawValue = entry.value ?? entry.id ?? '';
      const value = String(rawValue || '').trim();
      const label = entry.label ?? entry.name ?? value;
      const secondaryValue = entry.period_number ?? entry.secondaryValue ?? '';

      return value
        ? {
            value,
            label: String(label || value),
            secondaryValue: String(secondaryValue ?? '').trim(),
          }
        : null;
    }

    const value = String(entry || '').trim();
    return value ? { value, label: value, secondaryValue: '' } : null;
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
    onAdd?.(selectedOption, selectedLabel, selectedSecondaryOption);
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
                className="flex items-start gap-2"
              >
                <div className="flex-1">
                  <Select
                    label={enableSecondaryField ? primaryLabel : undefined}
                    labelClassName={enableSecondaryField ? 'text-xs mb-1' : undefined}
                    labelStyle={enableSecondaryField ? { color: 'var(--text-secondary, #6b7280)' } : undefined}
                    selectClassName={enableSecondaryField ? 'h-10 px-3 py-0' : undefined}
                    value={String(entry.value)}
                    onChange={(e) => {
                      const nextValue = String(e.target.value || '');
                      const nextItem = normalizedOptions.find((opt) => String(opt.value) === nextValue);
                      onUpdate?.(
                        index,
                        nextValue,
                        nextItem?.label || nextValue,
                        entry.secondaryValue,
                      );
                    }}
                    options={rowOptions}
                    disabled={disabled}
                    showPlaceholderOption={false}
                    reserveHelperSpace={false}
                  />
                </div>

                {enableSecondaryField && (
                  <div className="w-28">
                    <Input
                      label={secondaryLabel}
                      labelClassName="text-xs mb-1"
                      labelStyle={{ color: 'var(--text-secondary, #6b7280)' }}
                      type={secondaryType}
                      min={secondaryMin}
                      max={secondaryMax}
                      value={entry.secondaryValue}
                      onChange={(e) => {
                        onUpdate?.(
                          index,
                          entry.value,
                          entry.label,
                          e.target.value,
                        );
                      }}
                      disabled={disabled}
                      placeholder={secondaryPlaceholder}
                      className="h-10 px-3"
                      reserveHelperSpace={false}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onRemove?.(index)}
                  disabled={disabled}
                  className="h-10 w-10 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
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
        <div className="mt-3 flex items-start gap-2">
          <div className="flex-1">
            <Select
              label={enableSecondaryField ? primaryLabel : undefined}
              labelClassName={enableSecondaryField ? 'text-xs mb-1' : undefined}
              labelStyle={enableSecondaryField ? { color: 'var(--text-secondary, #6b7280)' } : undefined}
              selectClassName={enableSecondaryField ? 'h-10 px-3 py-0' : undefined}
              value={selectedOption}
              onChange={(e) => onSelectedOptionChange?.(e.target.value)}
              options={availableOptions}
              placeholder={placeholder}
              disabled={disabled}
              reserveHelperSpace={false}
            />
          </div>

          {enableSecondaryField && (
            <div className="w-28">
              <Input
                label={secondaryLabel}
                labelClassName="text-xs mb-1"
                labelStyle={{ color: 'var(--text-secondary, #6b7280)' }}
                type={secondaryType}
                min={secondaryMin}
                max={secondaryMax}
                value={selectedSecondaryOption}
                onChange={(e) => onSelectedSecondaryOptionChange?.(e.target.value)}
                disabled={disabled}
                placeholder={secondaryPlaceholder}
                className="h-10 px-3"
                reserveHelperSpace={false}
              />
            </div>
          )}

          {canHidePendingSelector && (
            <button
              type="button"
              onClick={() => {
                onSelectedOptionChange?.('');
                onSelectedSecondaryOptionChange?.('');
                setIsPendingRowVisible(false);
              }}
              disabled={disabled}
              className="h-10 w-10 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                color: 'var(--error, #dc2626)',
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
              aria-label="Quitar selector"
              title="Quitar selector"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {error ? (
        <p
          className="mt-1.5 text-xs"
          style={{ color: 'var(--error, #dc2626)' }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};

const SelectableValueShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  name: PropTypes.string,
  period_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  secondaryValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

const SelectOptionShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  disabled: PropTypes.bool,
});

SelectableListField.propTypes = {
  label: PropTypes.node,
  error: PropTypes.node,
  selectedValues: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      SelectableValueShape,
    ]),
  ),
  options: PropTypes.arrayOf(SelectOptionShape),
  selectedOption: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedSecondaryOption: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectedOptionChange: PropTypes.func,
  onSelectedSecondaryOptionChange: PropTypes.func,
  onAdd: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  placeholder: PropTypes.string,
  addLabel: PropTypes.string,
  disabled: PropTypes.bool,
  enableSecondaryField: PropTypes.bool,
  primaryLabel: PropTypes.string,
  secondaryLabel: PropTypes.string,
  secondaryPlaceholder: PropTypes.string,
  secondaryType: PropTypes.string,
  secondaryMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  secondaryMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
