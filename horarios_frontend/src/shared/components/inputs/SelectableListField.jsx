import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Info, Plus, Trash2, X } from 'lucide-react';
import { Select } from '@shared/components/inputs/Select';
import Input from '@shared/components/inputs/InputText';

const normalizeSelectableEntry = (entry) => {
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

const renderSummaryListContent = ({
  loading,
  loadingText,
  entries,
  emptyText,
  onRemove,
  disabled,
}) => {
  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)]">{loadingText}</p>;
  }

  if (entries.length === 0) {
    return <p className="text-sm italic text-[var(--text-tertiary)]">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry, index) => (
        <li
          key={`${String(entry.value)}-${index}`}
          className="flex items-start justify-between gap-2 text-sm text-[var(--text-primary)]"
        >
          <span>{entry.label || entry.value}</span>
          <button
            type="button"
            onClick={() => onRemove?.(index)}
            disabled={disabled}
            className="p-1 rounded text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--error,#dc2626)] disabled:opacity-50"
            aria-label={`Quitar ${entry.label || entry.value}`}
            title={`Quitar ${entry.label || entry.value}`}
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
};

/**
 * SelectableListField
 *
 * Props:
 * - label: Etiqueta principal del campo.
 * - error: Mensaje de error mostrado debajo del campo.
 * - selectedValues: Elementos seleccionados actualmente.
 * - options: Opciones disponibles para seleccionar.
 * - selectedOption: Valor seleccionado en el selector pendiente.
 * - selectedSecondaryOption: Valor secundario pendiente (si aplica).
 * - onSelectedOptionChange: Callback al cambiar seleccion principal pendiente.
 * - onSelectedSecondaryOptionChange: Callback al cambiar valor secundario pendiente.
 * - onAdd: Callback para agregar un elemento seleccionado.
 * - onUpdate: Callback para actualizar una fila existente.
 * - onRemove: Callback para eliminar una fila existente.
 * - placeholder: Placeholder del selector principal.
 * - addLabel: Texto del boton para agregar.
 * - infoMessage: Mensaje opcional para tooltip informativo.
 * - disabled: Deshabilita el control completo.
 * - colorVariant: 'user' | 'default' para elegir paleta de foco/accion.
 * - enableSecondaryField: Habilita un segundo campo por fila.
 * - primaryLabel: Etiqueta del campo principal en filas.
 * - secondaryLabel: Etiqueta del campo secundario en filas.
 * - secondaryPlaceholder: Placeholder del campo secundario.
 * - secondaryType: Tipo de input del campo secundario.
 * - secondaryMin: Minimo permitido para campo secundario numerico.
 * - secondaryMax: Maximo permitido para campo secundario numerico.
 * - displayMode: 'editable' (default) o 'summary' para mostrar lista simple.
 * - loading: Muestra estado de carga en la lista seleccionada.
 * - loadingText: Texto para estado de carga.
 * - emptyText: Texto cuando no hay elementos seleccionados.
 * - allowHidePendingSelector: Permite ocultar el selector pendiente (default true).
 * - summaryPanelClassName: Clases para el contenedor de lista en modo summary.
 * - summaryPanelPosition: Posicion del panel summary: 'above' o 'below' respecto al selector pendiente.
 * - headerClassName: Clases del contenedor de cabecera (label + boton agregar).
 * - labelClassName: Clases del texto de la etiqueta principal.
 * - addButtonClassName: Clases del boton agregar.
 * - showAddIcon: Si true, muestra icono Plus en el boton agregar.
 */

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
  placeholder = '',
  addLabel = 'Agregar',
  infoMessage,
  disabled = false,
  colorVariant = 'user',
  enableSecondaryField = false,
  primaryLabel = 'Elemento',
  secondaryLabel = 'Detalle',
  secondaryPlaceholder = 'Ej: 1',
  secondaryType = 'number',
  secondaryMin,
  secondaryMax,
  displayMode = 'editable',
  loading = false,
  loadingText = 'Cargando elementos…',
  emptyText = 'No hay elementos seleccionados',
  allowHidePendingSelector = true,
  summaryPanelClassName = 'min-h-[2.5rem] rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-surface)]',
  summaryPanelPosition = 'above',
  headerClassName = 'flex items-center justify-between mb-2',
  labelClassName = 'block text-sm font-medium text-[var(--text-primary)]',
  addButtonClassName = 'inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed',
  showAddIcon = true,
}) => {
  const [isPendingRowVisible, setIsPendingRowVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const normalizedSelectedEntries = useMemo(
    () => selectedValues.map(normalizeSelectableEntry).filter(Boolean),
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
  const canHidePendingSelector = allowHidePendingSelector && normalizedSelectedEntries.length > 0;
  const actionAccent = colorVariant === 'default'
    ? 'var(--system-accent, var(--accent, #2563eb))'
    : 'var(--accent, #2563eb)';
  const isSummaryMode = displayMode === 'summary';

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
      <div className={headerClassName}>
        <div className="flex items-center gap-2">
          <label className={labelClassName}>
            {label}
          </label>

          {infoMessage && (
            <div className="relative flex items-center">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip((prev) => !prev)}
                className="focus:outline-none transition-colors"
                style={{ color: 'var(--text-secondary, #6b7280)' }}
                aria-label="Ver informacion adicional"
                title="Ver informacion adicional"
              >
                <Info className="w-4 h-4" />
              </button>

              {showTooltip && (
                <div
                  className="absolute top-6 z-50 w-64 p-3 text-xs rounded-lg shadow-lg left-0"
                  style={{
                    backgroundColor: 'var(--bg-base, #111827)',
                    color: 'var(--text-primary, #f1f5f9)',
                    border: '1px solid var(--border-default, #334155)',
                  }}
                >
                  <div
                    className="absolute -top-1 left-2 w-2 h-2 transform rotate-45"
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
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={addButtonClassName}
          style={{ color: actionAccent }}
        >
          {showAddIcon ? <Plus size={16} /> : null}
          {addLabel}
        </button>
      </div>

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
              colorVariant={colorVariant}
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
                colorVariant={colorVariant}
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

      {(selectedValues.length > 0 || isSummaryMode) && (!isSummaryMode || summaryPanelPosition === 'above') && (
        <div className="mt-3">
          {isSummaryMode ? (
            <div className={summaryPanelClassName}>
              {renderSummaryListContent({
                loading,
                loadingText,
                entries: normalizedSelectedEntries,
                emptyText,
                onRemove,
                disabled,
              })}
            </div>
          ) : (
            <div className="space-y-2">
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
                        colorVariant={colorVariant}
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
                          colorVariant={colorVariant}
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
        </div>
      )}

      {isSummaryMode && summaryPanelPosition === 'below' && (
        <div className="mt-3">
          <div className={summaryPanelClassName}>
            {renderSummaryListContent({
              loading,
              loadingText,
              entries: normalizedSelectedEntries,
              emptyText,
              onRemove,
              disabled,
            })}
          </div>
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
  infoMessage: PropTypes.node,
  disabled: PropTypes.bool,
  colorVariant: PropTypes.oneOf(['user', 'default']),
  enableSecondaryField: PropTypes.bool,
  primaryLabel: PropTypes.string,
  secondaryLabel: PropTypes.string,
  secondaryPlaceholder: PropTypes.string,
  secondaryType: PropTypes.string,
  secondaryMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  secondaryMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayMode: PropTypes.oneOf(['editable', 'summary']),
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  emptyText: PropTypes.string,
  allowHidePendingSelector: PropTypes.bool,
  summaryPanelClassName: PropTypes.string,
  summaryPanelPosition: PropTypes.oneOf(['above', 'below']),
  headerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  addButtonClassName: PropTypes.string,
  showAddIcon: PropTypes.bool,
};
