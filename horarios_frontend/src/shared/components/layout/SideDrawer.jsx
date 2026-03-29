import React from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
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
 * - size: Tamaño del drawer ('sm' = 35%, 'md' = 50%, 'lg' = 65%). Default: 'md'.
 * - showCloseButton: Mostrar botón de cierre. Default: true.
 */
export const SideDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const sizeConfig = {
    sm: 'max-w-xs',  // ~35%
    md: 'max-w-md',  // ~50%
    lg: 'max-w-2xl', // ~65%
  };

  const maxWidthClass = sizeConfig[size] || sizeConfig.md;

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
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className={`pointer-events-auto relative ${maxWidthClass} w-screen transform transition duration-300 ease-in-out data-closed:translate-x-full`}
              style={{
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
            >
              <TransitionChild>
                <div
                  className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-300 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4"
                >
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="relative rounded-md transition-opacity hover:opacity-75"
                      style={{ color: 'var(--text-secondary, #6b7280)' }}
                      aria-label="Cerrar panel"
                    >
                      <span className="sr-only">Cerrar panel</span>
                      <X size={24} />
                    </button>
                  )}
                </div>
              </TransitionChild>

              <div className="relative flex h-full flex-col overflow-y-auto">
                {title && (
                  <div
                    className="border-b px-4 py-6 sm:px-6"
                    style={{
                      borderColor: 'var(--border-default, #d1d5db)',
                    }}
                  >
                    <DialogTitle
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary, #111827)' }}
                    >
                      {title}
                    </DialogTitle>
                  </div>
                )}

                <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6">
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
