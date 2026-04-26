import React from 'react';
import PropTypes from 'prop-types';
import { Home, Compass } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

/**
 * AppNotFoundScreen
 *
 * Pantalla 404 reusable para rutas no encontradas.
 */
export const AppNotFoundScreen = ({
  title = 'Pagina no encontrada',
  description = 'La ruta que intentaste abrir no existe o ya no esta disponible.',
  buttonLabel = 'Ir al inicio',
  onButtonClick,
}) => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 overflow-hidden relative bg-[var(--bg-base)]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background ambient blurs */}
      <div 
        className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] pointer-events-none"
        style={{ backgroundColor: 'var(--accent-subtle)', opacity: 0.5 }}
      />
      <div 
        className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full blur-[80px] pointer-events-none"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
      />

      <div className="relative z-10 max-w-lg w-full text-center rounded-[2.5rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 sm:p-14 shadow-2xl backdrop-blur-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl mb-8 transform -rotate-6 shadow-sm"
             style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          <Compass size={48} strokeWidth={1.5} />
        </div>

        <h1 
          className="text-6xl font-extrabold tracking-tighter mb-2 text-[var(--accent)]" 
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          404
        </h1>
        
        <h2 
          className="text-2xl font-bold mb-4 text-[var(--text-primary)]"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          {title.replace('404 - ', '')}
        </h2>

        <p className="text-base leading-relaxed mb-10 text-[var(--text-secondary)]">
          {description}
        </p>

        <div className="flex justify-center">
          <ActionButton
            icon={Home}
            label={buttonLabel}
            onClick={onButtonClick}
            variant="default"
            fullWidth={false}
            className="rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 px-8 py-4 font-semibold text-lg"
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
