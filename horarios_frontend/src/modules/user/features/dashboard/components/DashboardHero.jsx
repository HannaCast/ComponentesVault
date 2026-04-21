import PropTypes from 'prop-types';
import { CalendarRange, School } from 'lucide-react';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

export const DashboardHero = ({
  universityName,
  shortUniversityName,
  activePeriodName,
  completionScore,
}) => {
  return (
    <SurfacePanel className="overflow-hidden border-none relative" padding="p-0">
      <div
        className="relative px-6 py-6 md:px-8 md:py-7"
        style={{
          background:
            'linear-gradient(130deg, var(--accent-subtle, #eff6ff) 0%, var(--bg-elevated, #ffffff) 78%)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl"
          style={{ backgroundColor: 'var(--accent-subtle, #eff6ff)' }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Dashboard institucional
            </p>

            <h2
              className="text-2xl font-semibold leading-tight md:text-3xl"
              style={{ color: 'var(--text-primary, #111827)' }}
            >
              {universityName}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {shortUniversityName ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: 'var(--border-default, #d1d5db)',
                    color: 'var(--text-secondary, #6b7280)',
                    backgroundColor: 'var(--bg-elevated, #ffffff)',
                  }}
                >
                  <School className="h-3.5 w-3.5" aria-hidden />
                  {shortUniversityName}
                </span>
              ) : null}

              {activePeriodName ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: 'var(--border-default, #d1d5db)',
                    color: 'var(--text-secondary, #6b7280)',
                    backgroundColor: 'var(--bg-elevated, #ffffff)',
                  }}
                >
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                  Periodo activo: {activePeriodName}
                </span>
              ) : null}
            </div>
          </div>

          <div
            className="rounded-xl border px-4 py-3 md:min-w-44"
            style={{
              borderColor: 'var(--border-default, #d1d5db)',
              backgroundColor: 'var(--bg-elevated, #ffffff)',
            }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Avance general
            </p>
            <p className="mt-1 text-3xl font-semibold" style={{ color: 'var(--accent, #2563eb)' }}>
              {completionScore}%
            </p>
          </div>
        </div>
      </div>
    </SurfacePanel>
  );
};

DashboardHero.propTypes = {
  universityName: PropTypes.string.isRequired,
  shortUniversityName: PropTypes.string,
  activePeriodName: PropTypes.string,
  completionScore: PropTypes.number,
};
