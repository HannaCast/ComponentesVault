import React from 'react';
import PropTypes from 'prop-types';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { Switch } from '@shared/components/inputs/Switch';

/**
 * EntityListItem
 *
 * Props:
 * - icon: Componente de icono principal a renderizar (ej. BookOpen).
 * - title: Titulo principal del item.
 * - subtitle: Texto secundario opcional.
 * - metaItems: Lista de textos cortos para mostrar en linea, separados por punto.
 * - isActive: Valor booleano opcional para estado activo/inactivo.
 * - activeText: Etiqueta cuando isActive=true.
 * - inactiveText: Etiqueta cuando isActive=false.
 * - onToggleStatus: Callback opcional para cambiar estado (habilita el switch).
 * - onView: Callback opcional para accion visualizar.
 * - onEdit: Callback opcional para accion editar.
 * - onDelete: Callback opcional para accion eliminar.
 * - onContentClick: Callback opcional al hacer click en la seccion izquierda.
 */
export const EntityListItem = ({
  icon: Icon,
  title,
  subtitle,
  metaItems = [],
  isActive,
  activeText = 'Activo',
  inactiveText = 'Inactivo',
  onToggleStatus,
  onView,
  onEdit,
  onDelete,
  onContentClick,
  showBottomBorder = false,
  loadingAction = null,
  actionsDisabled = false,
}) => {
  const visibleMetaItems = metaItems.filter(Boolean);
  const isLoadingView = loadingAction === 'view';
  const isLoadingEdit = loadingAction === 'edit';
  const isLoadingDelete = loadingAction === 'delete';
  const isLoadingToggle = loadingAction === 'toggle';

  const viewDisabled = actionsDisabled || isLoadingEdit || isLoadingDelete || isLoadingToggle;
  const editDisabled = actionsDisabled || isLoadingView || isLoadingDelete || isLoadingToggle;
  const deleteDisabled = actionsDisabled || isLoadingView || isLoadingEdit || isLoadingToggle;

  const renderIconActionButton = ({
    onAction,
    isLoading,
    icon,
    disabled,
  }) => {
    if (!onAction) {
      return null;
    }

    if (isLoading) {
      return (
        <ActionButton
          label=""
          variant="secondary"
          size="large"
          fullWidth={false}
          loading
          loadingLabel=""
          customStyle={{ padding: '0.25rem', width: '2rem', height: '2rem' }}
        />
      );
    }

    return (
      <ActionButton
        icon={icon}
        label=""
        onClick={onAction}
        variant="secondary"
        size="large"
        fullWidth={false}
        customStyle={{ padding: '0.25rem' }}
        disabled={disabled}
      />
    );
  };

  const contentBody = (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--primary-100, rgba(37, 99, 235, 0.1))' }}
      >
        {Icon ? <Icon className="w-5 h-5" style={{ color: 'var(--primary-color, #2563eb)' }} /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className="font-medium truncate"
          style={{ color: 'var(--text-primary, #111827)' }}
          title={title}
        >
          {title}
        </h3>

        {subtitle ? (
          <p
            className="text-sm mt-1 truncate"
            style={{ color: 'var(--text-secondary, #6b7280)' }}
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}

        {visibleMetaItems.length > 0 ? (
          <div
            className="flex items-center gap-2 text-sm mt-1 min-w-0 overflow-hidden whitespace-nowrap"
            style={{ color: 'var(--text-secondary, #6b7280)' }}
          >
            {visibleMetaItems.map((item, idx) => (
              <React.Fragment key={`${item}-${idx}`}>
                {idx > 0 ? <span className="shrink-0">•</span> : null}
                <span className="truncate max-w-[10rem] sm:max-w-[14rem]" title={item}>{item}</span>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
  
  return (
    <div
      className="p-4 transition-colors hover:opacity-75"
      style={{
        backgroundColor: 'var(--bg-elevated, #ffffff)',
        borderBottom: showBottomBorder ? '1px solid var(--border-subtle, #e5e7eb)' : 'none',
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {onContentClick ? (
          <button
            type="button"
            className="w-full min-w-0 sm:flex-1 cursor-pointer text-left bg-transparent border-0 p-0"
            onClick={onContentClick}
          >
            {contentBody}
          </button>
        ) : (
          <div className="w-full min-w-0 sm:flex-1">
            {contentBody}
          </div>
        )}

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 md:gap-3">
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm hidden md:inline" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                    {isActive ? activeText : inactiveText}
                </span>
                {isLoadingToggle ? (
                  <div
                    className="h-6 w-11 rounded-full border flex items-center justify-center"
                    style={{ borderColor: 'var(--border-default, #d1d5db)' }}
                  >
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" style={{ color: 'var(--accent, #2563eb)' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <Switch checked={Boolean(isActive)} onCheckedChange={onToggleStatus} disabled={actionsDisabled} />
                )}
            </div>

            {(onView || onEdit || onDelete) && (
              <div className="flex items-center gap-1 shrink-0">
                {renderIconActionButton({
                  onAction: onView,
                  isLoading: isLoadingView,
                  icon: Eye,
                  disabled: viewDisabled,
                })}
                {renderIconActionButton({
                  onAction: onEdit,
                  isLoading: isLoadingEdit,
                  icon: Pencil,
                  disabled: editDisabled,
                })}
                {renderIconActionButton({
                  onAction: onDelete,
                  isLoading: isLoadingDelete,
                  icon: Trash2,
                  disabled: deleteDisabled,
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

EntityListItem.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  metaItems: PropTypes.arrayOf(PropTypes.node),
  isActive: PropTypes.bool,
  activeText: PropTypes.string,
  inactiveText: PropTypes.string,
  onToggleStatus: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onContentClick: PropTypes.func,
  showBottomBorder: PropTypes.bool,
  loadingAction: PropTypes.oneOf(['view', 'edit', 'delete', 'toggle', null]),
  actionsDisabled: PropTypes.bool,
};
