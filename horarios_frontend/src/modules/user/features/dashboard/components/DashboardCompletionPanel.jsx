import PropTypes from 'prop-types';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

const formatCounter = (item) => {
  const current = Number(item?.current) || 0;
  const target = Number(item?.target) || 0;

  if (target <= 1) {
    return `${current}`;
  }

  return `${current}/${target}`;
};

export const DashboardCompletionPanel = ({ completion }) => {
  const score = Number(completion?.score_percentage) || 0;
  const items = Array.isArray(completion?.items) ? completion.items : [];
  const completedModules = Number(completion?.completed_modules) || 0;
  const totalModules = Number(completion?.total_modules) || items.length;

  return (
    <SurfacePanel className="h-full" padding="p-5">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
            Progreso de configuracion institucional
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            {completedModules} de {totalModules} modulos completados
          </p>
        </div>

        <div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--bg-surface, #f3f4f6)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, score))}%`,
                backgroundColor: 'var(--accent, #2563eb)',
              }}
            />
          </div>
          <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Avance global: {score}%
          </p>
        </div>

        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
            >
              <div className="flex items-start gap-2">
                {item.is_complete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4" style={{ color: '#16a34a' }} aria-hidden />
                ) : (
                  <CircleDashed className="mt-0.5 h-4 w-4" style={{ color: 'var(--warning, #d97706)' }} aria-hidden />
                )}

                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary, #111827)' }}>
                    {item.label}
                  </p>
                  {!item.is_complete && item.hint ? (
                    <p className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                      {item.hint}
                    </p>
                  ) : null}
                </div>
              </div>

              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                {formatCounter(item)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SurfacePanel>
  );
};

DashboardCompletionPanel.propTypes = {
  completion: PropTypes.shape({
    score_percentage: PropTypes.number,
    completed_modules: PropTypes.number,
    total_modules: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        current: PropTypes.number,
        target: PropTypes.number,
        is_complete: PropTypes.bool,
        hint: PropTypes.string,
      }),
    ),
  }),
};
