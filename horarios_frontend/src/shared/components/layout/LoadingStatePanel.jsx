import React from 'react';
import PropTypes from 'prop-types';
import { SurfacePanel } from './SurfacePanel';

// Componente reusable para mostrar un estado de carga centrado dentro de un panel.
/**
 * LoadingStatePanel
 *
 * Componente reusable para mostrar un estado de carga centrado dentro de un panel.
 */
export const LoadingStatePanel = ({
  message = 'Cargando...',
  padding = 'p-12',
  spinnerSizeClass = 'w-8 h-8 border-4',
}) => {
  return (
    <SurfacePanel padding={padding} centered>
      <div className="inline-block">
        <div
          className={`animate-spin ${spinnerSizeClass} rounded-full`}
          style={{
            borderColor: 'var(--border-default, #d1d5db)',
            borderTopColor: 'var(--accent, #2563eb)',
          }}
        />
      </div>
      <p className="mt-4" style={{ color: 'var(--text-secondary, #6b7280)' }}>
        {message}
      </p>
    </SurfacePanel>
  );
};

LoadingStatePanel.propTypes = {
  message: PropTypes.node,
  padding: PropTypes.string,
  spinnerSizeClass: PropTypes.string,
};
