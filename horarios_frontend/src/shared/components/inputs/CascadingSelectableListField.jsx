import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2 } from 'lucide-react';
import { Select } from '@shared/components/inputs/Select';

/**
 * CascadingSelectableListField
 *
 * Props:
 * - label: Titulo principal del bloque.
 * - description: Texto explicativo opcional.
 * - selectors: Arreglo de selectores encadenados [{ key, label, options, value, onChange, placeholder, disabled }].
 * - addLabel: Texto del boton de agregar.
 * - onAdd: Callback para agregar el elemento seleccionado.
 * - addDisabled: Deshabilita el boton de agregar.
 * - disabled: Deshabilita el control completo.
 * - loading: Muestra texto de carga del catalogo encadenado.
 * - loadingText: Texto mostrado cuando loading=true.
 * - notice: Mensaje informativo adicional antes de errores.
 * - error: Mensaje de error mostrado debajo de los selectores.
 * - items: Lista seleccionada [{ id, primaryText, secondaryText }].
 * - emptyText: Texto cuando no hay elementos seleccionados.
 * - onRemove: Callback al quitar un elemento (recibe item completo).
 * - removeLabel: Etiqueta base del boton de quitar (accesibilidad).
 * - colorVariant: 'user' | 'default' para color del boton agregar.
 */
export const CascadingSelectableListField = ({
  label,
  description,
  selectors = [],
  addLabel = 'Agregar',
  onAdd,
  addDisabled = false,
  disabled = false,
  loading = false,
  loadingText = 'Cargando catálogo…',
  notice,
  error,
  items = [],
  emptyText = 'Sin elementos seleccionados',
  onRemove,
  removeLabel = 'Quitar elemento',
  colorVariant = 'user',
}) => {
  const actionAccent = colorVariant === 'default'
    ? 'var(--system-accent, var(--accent, #2563eb))'
    : 'var(--accent, #2563eb)';

  const canAdd = !disabled && !addDisabled;

  return (
    <div className="space-y-3 pt-2 border-t border-dashed border-[var(--border-default)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline disabled:opacity-50"
          style={{ color: actionAccent }}
          onClick={onAdd}
          disabled={!canAdd}
        >
          <Plus size={16} />
          {addLabel}
        </button>
      </div>

      {description ? (
        <p className="text-xs text-[var(--text-secondary)]">{description}</p>
      ) : null}

      <div className={`grid grid-cols-1 gap-3 ${selectors.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {selectors.map((selector) => (
          <div key={selector.key}>
            <Select
              label={selector.label}
              options={Array.isArray(selector.options) ? selector.options : []}
              value={selector.value}
              onChange={(e) => selector.onChange?.(e.target.value)}
              placeholder={selector.placeholder || ''}
              disabled={disabled || Boolean(selector.disabled)}
              reserveHelperSpace={false}
            />
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-[var(--text-secondary)]">{loadingText}</p>
      ) : null}

      {notice ? (
        <p className="text-xs text-[var(--text-secondary)]">{notice}</p>
      ) : null}

      {error ? (
        <p className="text-xs" style={{ color: 'var(--error, #dc2626)' }}>
          {error}
        </p>
      ) : null}

      <div className="min-h-[2.5rem] rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
        {items.length === 0 ? (
          <p className="text-sm italic text-[var(--text-tertiary)]">{emptyText}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 text-sm text-[var(--text-primary)]"
              >
                <div>
                  <p>{item.primaryText || '—'}</p>
                  {item.secondaryText ? (
                    <p className="text-xs text-[var(--text-secondary)]">{item.secondaryText}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="p-1 rounded text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--error,#dc2626)] disabled:opacity-50"
                  onClick={() => onRemove?.(item)}
                  disabled={disabled}
                  aria-label={removeLabel}
                  title={removeLabel}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const SelectorShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
      label: PropTypes.node,
      disabled: PropTypes.bool,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
});

const ItemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  primaryText: PropTypes.node,
  secondaryText: PropTypes.node,
});

CascadingSelectableListField.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  selectors: PropTypes.arrayOf(SelectorShape),
  addLabel: PropTypes.string,
  onAdd: PropTypes.func,
  addDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  notice: PropTypes.node,
  error: PropTypes.node,
  items: PropTypes.arrayOf(ItemShape),
  emptyText: PropTypes.string,
  onRemove: PropTypes.func,
  removeLabel: PropTypes.string,
  colorVariant: PropTypes.oneOf(['user', 'default']),
};
