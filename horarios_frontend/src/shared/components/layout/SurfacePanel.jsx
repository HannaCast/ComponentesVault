import React from 'react';

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
