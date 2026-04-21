import PropTypes from 'prop-types';
import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

export const DashboardQuickAccess = ({ items }) => {
  return (
    <SurfacePanel padding="p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
          Accesos rapidos
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Atajos directos a los modulos de trabajo.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ icon, label, path }) => (
          <li key={path} className="flex h-full min-h-0">
            <Link
              to={path}
              className="group flex h-full w-full items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200 ease-out hover:-translate-y-0.5"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--accent-subtle, #eff6ff)' }}
              >
                {createElement(icon, {
                  className: 'h-5 w-5',
                  style: { color: 'var(--accent, #2563eb)' },
                  'aria-hidden': true,
                })}
              </span>

              <span
                className="text-sm font-medium leading-snug"
                style={{ color: 'var(--text-primary, #111827)' }}
              >
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SurfacePanel>
  );
};

DashboardQuickAccess.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
