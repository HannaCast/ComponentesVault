import { useEffect, useRef } from 'react';
import { useAuth } from '@context/AuthContext';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { SelectedUniversityAlert } from '@shared/components/layout/SelectedUniversityAlert';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { getSelectedUniversityDisplayName, getSelectedUniversityId } from '@shared/utils/universityContext';
import { USER_MENU_ITEMS } from '../../../../../core/navigation/userMenuItems';
import { DashboardCompletionPanel } from '../components/DashboardCompletionPanel';
import { DashboardDraftAlert } from '../components/DashboardDraftAlert';
import { DashboardHero } from '../components/DashboardHero';
import { DashboardMetricCards } from '../components/DashboardMetricCards';
import { DashboardQuickAccess } from '../components/DashboardQuickAccess';
import { DashboardScheduleSteps } from '../components/DashboardScheduleSteps';
import { useDashboard } from '../hooks/useDashboard';

const QUICK_ACCESS_ITEMS = USER_MENU_ITEMS.filter(
  (item) => item.path !== '/usuario/dashboard',
);

export const UserHomePage = () => {
  const { user, authLoading, restoreSession } = useAuth();
  const selectedUniversity = user?.selected_university || null;
  const selectedUniversityId = getSelectedUniversityId(selectedUniversity);
  const hasSelectedUniversity = Boolean(selectedUniversity) || selectedUniversityId !== null;
  const attemptedSessionSyncRef = useRef(false);
  const { shouldRun } = useRequestDeduper({ windowMs: 180 });

  const {
    summary,
    loading,
    error,
    fetchDashboardSummary,
  } = useDashboard();

  useEffect(() => {
    if (!selectedUniversityId) {
      return;
    }

    const signature = buildRequestSignature(
      {
        resource: 'dashboard-summary-page',
        selectedUniversityId,
      },
      ['resource', 'selectedUniversityId'],
    );

    if (!shouldRun(signature)) {
      return;
    }

    fetchDashboardSummary({ selectedUniversityId });
  }, [selectedUniversityId, fetchDashboardSummary, shouldRun]);

  useEffect(() => {
    if (authLoading || hasSelectedUniversity || attemptedSessionSyncRef.current) {
      return;
    }

    attemptedSessionSyncRef.current = true;
    restoreSession()
      .catch(() => {
        // Si la sincronizacion falla, mostramos vista sin universidad de forma controlada.
      });
  }, [authLoading, hasSelectedUniversity, restoreSession]);

  const fallbackUniversity = selectedUniversity;
  const summaryUniversity = summary?.university || fallbackUniversity;
  const universityName = getSelectedUniversityDisplayName(
    summaryUniversity,
    'Universidad seleccionada',
  );
  const shortUniversityName = String(summary?.university?.short_name || '').trim() || null;

  const usesPeriodGroups = summaryUniversity?.uses_period_groups === 1 || summaryUniversity?.uses_period_groups === true;

  const activePeriodName = usesPeriodGroups ? (String(
    summary?.university?.active_period_name
      || user?.selected_university_active_period_name
      || '',
  ).trim() || null) : null;

  const completionScore = Number(summary?.completion?.score_percentage) || 0;

  if (authLoading) {
    return <LoadingStatePanel message="Cargando dashboard institucional..." />;
  }

  if (!hasSelectedUniversity) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <DashboardHero
          universityName="Sin universidad seleccionada"
          shortUniversityName={null}
          activePeriodName={null}
          completionScore={0}
        />

        <SelectedUniversityAlert message="Selecciona una universidad para ver tus indicadores y poder generar horarios." />

        <DashboardQuickAccess items={QUICK_ACCESS_ITEMS} />

        <DashboardScheduleSteps hasSelectedUniversity={true} />
      </div>
    );
  }

  if (loading && !summary) {
    return <LoadingStatePanel message="Cargando dashboard institucional..." />;
  }

  if (error && !summary) {
    return (
      <SurfacePanel padding="p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
          No fue posible cargar el dashboard
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchDashboardSummary({
            force: true,
            selectedUniversityId,
          })}
          className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--border-default, #d1d5db)',
            color: 'var(--text-primary, #111827)',
            backgroundColor: 'var(--bg-elevated, #ffffff)',
          }}
        >
          Reintentar
        </button>
      </SurfacePanel>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <DashboardHero
        universityName={universityName}
        shortUniversityName={shortUniversityName}
        activePeriodName={activePeriodName}
        completionScore={completionScore}
      />

      {error ? (
        <SurfacePanel padding="p-3">
          <p className="text-sm" style={{ color: 'var(--warning-text, #92400e)' }}>
            {error}
          </p>
        </SurfacePanel>
      ) : null}

      <DashboardMetricCards counts={summary?.counts} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardDraftAlert scheduleGeneration={summary?.schedule_generation} />
        <DashboardCompletionPanel completion={summary?.completion} />
      </div>

      <DashboardQuickAccess items={QUICK_ACCESS_ITEMS} />

      <DashboardScheduleSteps />
    </div>
  );
};
