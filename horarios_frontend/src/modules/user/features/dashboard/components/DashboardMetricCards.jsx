import PropTypes from 'prop-types';
import { createElement } from 'react';
import {
  BookOpen,
  Building2,
  GraduationCap,
  UserCheck,
  Users,
} from 'lucide-react';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

const METRIC_CONFIG = [
  {
    key: 'careers',
    label: 'Carreras',
    icon: GraduationCap,
  },
  {
    key: 'subjects',
    label: 'Materias',
    icon: BookOpen,
  },
  {
    key: 'groups',
    label: 'Grupos',
    icon: Users,
  },
  {
    key: 'teachers',
    label: 'Profesores',
    icon: UserCheck,
  },
  {
    key: 'classrooms',
    label: 'Aulas',
    icon: Building2,
  },
];

const resolveMetricValue = (counts, key) => {
  const metric = counts?.[key];
  if (!metric || typeof metric !== 'object') {
    return { total: 0, active: 0 };
  }

  return {
    total: Number(metric.total) || 0,
    active: Number(metric.active) || 0,
  };
};

export const DashboardMetricCards = ({ counts }) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {METRIC_CONFIG.map(({ key, label, icon }) => {
        const metric = resolveMetricValue(counts, key);

        return (
          <SurfacePanel key={key} className="h-full" padding="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  {label}
                </p>

                <p className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
                  {metric.total}
                </p>

                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  Activos: {metric.active}
                </p>
              </div>

              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--accent-subtle, #eff6ff)' }}
              >
                {createElement(icon, {
                  className: 'h-5 w-5',
                  style: { color: 'var(--accent, #2563eb)' },
                  'aria-hidden': true,
                })}
              </div>
            </div>
          </SurfacePanel>
        );
      })}
    </div>
  );
};

DashboardMetricCards.propTypes = {
  counts: PropTypes.shape({
    careers: PropTypes.shape({ total: PropTypes.number, active: PropTypes.number }),
    subjects: PropTypes.shape({ total: PropTypes.number, active: PropTypes.number }),
    groups: PropTypes.shape({ total: PropTypes.number, active: PropTypes.number }),
    teachers: PropTypes.shape({ total: PropTypes.number, active: PropTypes.number }),
    classrooms: PropTypes.shape({ total: PropTypes.number, active: PropTypes.number }),
  }),
};
