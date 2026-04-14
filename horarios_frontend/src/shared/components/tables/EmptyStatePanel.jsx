import React from 'react';
import PropTypes from 'prop-types';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { ActionButton } from '@shared/components/inputs/ActionButton';

/**
 * EmptyStatePanel
 *
 * Props:
 * - icon: Componente de icono opcional.
 * - title: Titulo principal del estado vacio.
 * - description: Descripcion secundaria del estado vacio.
 * - actionIcon: Icono opcional del boton de accion.
 * - actionLabel: Texto del boton de accion.
 * - onAction: Callback del boton de accion.
 */
export const EmptyStatePanel = ({
  icon: Icon,
  title,
  description,
  actionIcon,
  actionLabel,
  onAction,
}) => {
  return (
    <SurfacePanel padding="p-12" centered>
      {Icon ? <Icon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary, #6b7280)' }} /> : null}

      <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary, #111827)' }}>
        {title}
      </h3>

      {description ? (
        <p className="mb-6" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          {description}
        </p>
      ) : null}

      {actionLabel && onAction ? (
        <div className="flex justify-center">
          <ActionButton
            icon={actionIcon}
            label={actionLabel}
            onClick={onAction}
            variant="primary"
            size="medium"
            fullWidth={false}
          />
        </div>
      ) : null}
    </SurfacePanel>
  );
};

EmptyStatePanel.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node,
  description: PropTypes.node,
  actionIcon: PropTypes.elementType,
  actionLabel: PropTypes.node,
  onAction: PropTypes.func,
};
