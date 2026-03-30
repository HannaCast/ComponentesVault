import { AppRouter } from './core/routes/AppRouter';
import { AuthProvider } from './core/context/AuthContext';
import { ToastBar, Toaster, toast } from 'react-hot-toast';
import { X } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      {/* Enrutador principal de la aplicación, maneja todas las rutas y vistas internas. */}
      <AppRouter />

      {/* Componente de notificaciones globales utilizando react-hot-toast */}
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{
          top: '5.5rem',
        }}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.16)',
          },
          success: {
            iconTheme: {
              primary: 'var(--accent)',
              secondary: 'var(--text-on-accent)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--error)',
              secondary: 'var(--text-on-accent)',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex items-center gap-3">
                {icon}
                <span>{message}</span>
                {t.type !== 'loading' && (
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-1 inline-flex items-center justify-center rounded p-1 transition-opacity hover:opacity-75"
                    aria-label="Cerrar notificacion"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X size={14} strokeWidth={2.25} />
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </AuthProvider>
  );
}

export default App;
