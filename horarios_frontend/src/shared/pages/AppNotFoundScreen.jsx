import React from 'react';
import PropTypes from 'prop-types';
import { Home } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

/**
 * AppNotFoundScreen
 *
 * Pantalla 404 reusable para rutas no encontradas.
 */
export const AppNotFoundScreen = ({
  title = '404 - Pagina no encontrada',
  description = 'La ruta que intentaste abrir no existe o ya no esta disponible.',
  buttonLabel = 'Ir al inicio',
  onButtonClick,
}) => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--bg-base, #ffffff)' }}
    >
      <div className="max-w-xl w-full text-center rounded-xl border p-8"
        style={{
          backgroundColor: 'var(--bg-elevated, #ffffff)',
          borderColor: 'var(--border-default, #d1d5db)',
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Error de ruta
        </p>

        <h1 className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary, #111827)' }}>
          {title}
        </h1>

        <p className="mt-3" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          {description}
        </p>

        <div className="mt-6 flex justify-center">
          <ActionButton
            icon={Home}
            label={buttonLabel}
            onClick={onButtonClick}
            variant="primary"
            size="medium"
            fullWidth={false}
          />
        </div>
      </div>
    </div>
  );
};

AppNotFoundScreen.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  buttonLabel: PropTypes.node,
  onButtonClick: PropTypes.func,
};
