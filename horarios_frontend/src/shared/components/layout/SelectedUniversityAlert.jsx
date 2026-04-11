import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';

// Componente de alerta para mostrar cuando no hay universidad seleccionada, con mensaje personalizable.
/**
 * SelectedUniversityAlert
 *
 * Props:
 * - message: Mensaje a mostrar cuando no hay universidad seleccionada.
 */
export const SelectedUniversityAlert = ({
  message = 'Por favor selecciona una universidad en el apartado de Universidades',
}) => {
  return (
    <div
      className="rounded-lg border p-6 text-center"
      style={{
        backgroundColor: 'var(--warning-subtle, #fef3c7)',
        borderColor: 'var(--warning-border, #fcd34d)',
      }}
    >
      <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--warning, #f59e0b)' }} />
      <p className="font-medium" style={{ color: 'var(--warning-text, #92400e)' }}>
        {message}
      </p>
    </div>
  );
};

SelectedUniversityAlert.propTypes = {
  message: PropTypes.node,
};
