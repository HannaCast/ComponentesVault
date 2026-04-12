import { Link } from 'react-router-dom';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { USER_MENU_ITEMS } from '../../../../../core/navigation/userMenuItems';

export const UserHomePage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <PageSectionHeader
        title="Panel principal"
        contextLabel="Acceso rápido a las funciones del sistema"
      />

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {USER_MENU_ITEMS.map(({ icon: Icon, label, path }) => (
          <li key={path} className="flex h-full min-h-0">
            <Link
              to={path}
              className="group flex h-full w-full flex-col gap-4 rounded-lg border p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--bg-surface)]"
              style={{
                backgroundColor: 'var(--bg-elevated, #ffffff)',
                borderColor: 'var(--border-default, #d1d5db)',
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 group-hover:bg-[var(--accent-subtle)]"
                style={{ backgroundColor: 'var(--accent-subtle, #eff6ff)' }}
              >
                <Icon
                  className="h-6 w-6 transition-transform duration-200 group-hover:scale-105"
                  style={{ color: 'var(--accent, #2563eb)' }}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 text-left">
                <span
                  className="block text-base font-semibold leading-snug"
                  style={{ color: 'var(--text-primary, #111827)' }}
                >
                  {label}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
