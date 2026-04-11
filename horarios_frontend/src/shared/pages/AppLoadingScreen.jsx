import React from 'react';
import PropTypes from 'prop-types';

/**
 * AppLoadingScreen
 *
 * Pantalla de carga full-screen para el arranque y validacion de sesion.
 */
export const AppLoadingScreen = ({ message = 'Cargando aplicacion...' }) => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--bg-base, #ffffff)' }}
    >
      <div className="flex flex-col items-center">
        <div
          className="animate-spin w-15 h-15 border-4 rounded-full"
          style={{
            borderColor: 'var(--border-default, #d1d5db)',
            borderTopColor: 'var(--accent, #2563eb)',
          }}
        />
        <p className="mt-4 text-md" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          {message}
        </p>
      </div>
    </div>
  );
};

AppLoadingScreen.propTypes = {
  message: PropTypes.node,
};
