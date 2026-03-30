import React from 'react';

// Componente de panel reutilizable con estilos base para superficies elevadas o de fondo, con opciones de padding y centrado.
export const SurfacePanel = ({
  children,
  className = '',
  padding = 'p-4',
  centered = false,
  elevated = true,
}) => {
  return (
    <div
      className={`rounded-lg border ${padding} ${centered ? 'text-center' : ''} ${className}`}
      style={{
        backgroundColor: elevated ? 'var(--bg-elevated, #ffffff)' : 'var(--bg-surface, #f3f4f6)',
        borderColor: 'var(--border-default, #d1d5db)',
      }}
    >
      {children}
    </div>
  );
};
