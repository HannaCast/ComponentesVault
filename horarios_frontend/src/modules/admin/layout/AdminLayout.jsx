import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { X } from 'lucide-react';
import { Sidebar } from '@shared/components/layout/Sidebar';
import { Header } from '@shared/components/layout/Header';

export const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-shell h-screen flex flex-col bg-[var(--bg-base)]">
      <Header className="app-shell-header" onMenuClick={openMobileMenu} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="app-shell-sidebar hidden lg:block" />
        <main className="app-shell-main flex-1 overflow-y-auto bg-[var(--bg-surface)]">
          <div className="app-shell-content p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Dialog open={isMobileMenuOpen} onClose={closeMobileMenu} className="no-print relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 transition-opacity duration-300 ease-in-out data-closed:opacity-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10 sm:pr-16">
              <DialogPanel
                transition
                className="pointer-events-auto relative w-screen max-w-[85vw] sm:max-w-xs transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                style={{
                  borderRight: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-base, #ffffff)',
                }}
              >
                <div className="h-full flex flex-col overflow-y-auto">
                  <div
                    className="flex items-center justify-end px-3 py-2 border-b"
                    style={{ borderColor: 'var(--border-subtle, #e2e8f0)' }}
                  >
                    <button
                      type="button"
                      onClick={closeMobileMenu}
                      className="h-9 w-9 rounded-lg border flex items-center justify-center"
                      style={{
                        borderColor: 'var(--border-default, #d1d5db)',
                        color: 'var(--text-primary, #111827)',
                        backgroundColor: 'var(--bg-elevated, #ffffff)',
                      }}
                      aria-label="Cerrar menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <Sidebar className="w-full h-full border-r-0" onNavigate={closeMobileMenu} />
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
