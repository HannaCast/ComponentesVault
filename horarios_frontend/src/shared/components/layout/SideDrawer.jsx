import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

/**
 * SideDrawer
 *
 * Componente de panel lateral deslizable reutilizable.
 *
 * Props:
 * - isOpen: Booleano para controlar si está abierto.
 * - onClose: Callback al cerrar el drawer.
 * - title: Titulo del drawer.
 * - children: Contenido del drawer.
 * - size: Tamaño del drawer ('sm' | 'md' | 'lg' | 'full'). 'full' ocupa el ancho completo de la ventana. Predeterminado: 'md'.
 * - showCloseButton: Mostrar botón de cierre. Default: true.
 * - headerLayout: 'default' muestra título/icono; 'closeOnly' solo barra con botón cerrar.
 * - panelClassName: clases extra del panel (p. ej. fondo gris).
 * - bodyClassName: reemplaza el padding por defecto del cuerpo si se indica (p. ej. p-0).
 */
export const SideDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  headerIcon: HeaderIcon,
  headerBadge,
  headerLayout = 'default',
  panelClassName = '',
  bodyClassName,
}) => {
  const sizeConfig = {
    sm: 'max-w-xs',  // ~35%
    md: 'max-w-md',  // ~50%
    lg: 'max-w-2xl', // ~65%
    full: 'max-w-full',
  };

  const maxWidthClass = sizeConfig[size] || sizeConfig.md;
  const isFull = size === 'full';
  const closeOnlyHeader = headerLayout === 'closeOnly';
  const defaultBodyClass = isFull
    ? 'relative flex-1 overflow-y-auto min-h-0 px-4 py-4 sm:px-6 lg:px-8'
    : 'relative flex-1 overflow-y-auto min-h-0 px-4 py-4 sm:px-5';
  const resolvedBodyClass = bodyClassName != null && String(bodyClassName).trim() !== ''
    ? bodyClassName
    : defaultBodyClass;
  const panelContainerClass = isFull
    ? 'pointer-events-none fixed inset-0 flex max-w-full'
    : 'pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16';
  const panelBaseClass = isFull
    ? 'pointer-events-auto relative h-full w-full max-w-full transform transition duration-300 ease-in-out data-closed:translate-x-full'
    : `pointer-events-auto relative ${maxWidthClass} w-screen transform transition duration-300 ease-in-out data-closed:translate-x-full`;
  const dialogPanelClassName = `${panelBaseClass} ${panelClassName}`.trim();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 transition-opacity duration-300 ease-in-out data-closed:opacity-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className={panelContainerClass}>
            <DialogPanel
              transition
              className={dialogPanelClassName}
              style={
                panelClassName.trim()
                  ? undefined
                  : { backgroundColor: 'var(--bg-elevated, #ffffff)' }
              }
            >
              <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
                {closeOnlyHeader ? (
                  <div
                    className="flex shrink-0 items-center justify-end border-b px-3 py-2.5 sm:px-4"
                    style={{
                      borderColor: 'var(--border-default, #d1d5db)',
                      backgroundColor: 'var(--bg-surface, #f3f4f6)',
                    }}
                  >
                    <DialogTitle className="sr-only">Panel lateral</DialogTitle>
                    {showCloseButton ? (
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-10 rounded-xl border transition-colors flex items-center justify-center"
                        style={{
                          borderColor: 'var(--border-default, #d1d5db)',
                          color: 'var(--text-secondary, #6b7280)',
                          backgroundColor: 'var(--bg-elevated, #ffffff)',
                        }}
                        aria-label="Cerrar panel"
                      >
                        <span className="sr-only">Cerrar panel</span>
                        <X size={16} />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {!closeOnlyHeader && title ? (
                  <div
                    className="border-b px-4 py-3 sm:px-5 shrink-0"
                    style={{
                      borderColor: 'var(--border-default, #d1d5db)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {HeaderIcon ? (
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--primary-100, rgba(37, 99, 235, 0.12))' }}
                          >
                            <HeaderIcon size={16} style={{ color: 'var(--accent, #2563eb)' }} />
                          </div>
                        ) : null}

                        <div className="min-w-0">
                          <DialogTitle
                            className="text-base font-semibold truncate"
                            style={{ color: 'var(--text-primary, #111827)' }}
                          >
                            {title}
                          </DialogTitle>
                        </div>

                        {headerBadge ? (
                          <span
                            className="px-2 py-0.5 text-xs font-semibold rounded-full"
                            style={{
                              color: 'var(--text-primary, #111827)',
                              backgroundColor: 'var(--accent-subtle, #dbeafe)',
                            }}
                          >
                            {headerBadge}
                          </span>
                        ) : null}
                      </div>

                      {showCloseButton && (
                        <button
                          type="button"
                          onClick={onClose}
                          className="h-8 w-10 rounded-xl border transition-colors flex items-center justify-center"
                          style={{
                            borderColor: 'var(--border-default, #d1d5db)',
                            color: 'var(--text-secondary, #6b7280)',
                            backgroundColor: 'var(--bg-elevated, #ffffff)',
                          }}
                          aria-label="Cerrar panel"
                        >
                          <span className="sr-only">Cerrar panel</span>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className={resolvedBodyClass}>
                  {children}
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

SideDrawer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'full']),
  showCloseButton: PropTypes.bool,
  headerIcon: PropTypes.elementType,
  headerBadge: PropTypes.node,
  headerLayout: PropTypes.oneOf(['default', 'closeOnly']),
  panelClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
};
