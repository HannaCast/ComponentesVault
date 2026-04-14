import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { ScheduleGeneratedPanel } from '../components/ScheduleGeneratedPanel';
import { useScheduleGenerator } from '../hooks/useScheduleGenerator';

const DEFAULT_VIEW_CONFIG = {
  showTeacherNames: false,
  includeHeader: false,
  useSubjectColors: false,
  forceWhiteBackground: false,
  adjustToShiftWindow: true,
  use12HourFormat: false,
};

const getSelectedUniversityName = (selectedUniversity) => {
  if (!selectedUniversity) {
    return 'Sin universidad seleccionada';
  }

  if (typeof selectedUniversity === 'string') {
    return selectedUniversity;
  }

  const fullName = String(selectedUniversity.name || '').trim();
  const shortName = String(selectedUniversity.short_name || '').trim();

  if (fullName && shortName && fullName.toLowerCase() !== shortName.toLowerCase()) {
    return `${fullName} (${shortName})`;
  }

  return fullName || shortName || 'Universidad seleccionada';
};

export const ScheduleVersionDetailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { versionId } = useParams();

  const selectedUniversity = user?.selected_university;

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [viewConfig, setViewConfig] = useState(DEFAULT_VIEW_CONFIG);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);

  const {
    selectedVersion,
    selectedVersionLoading,
    historyError,
    setHistoryError,
    pendingAction,
    loadVersionDetail,
    generateScheduleVersion,
    confirmVersionById,
  } = useScheduleGenerator();

  const selectedUniversityName = useMemo(
    () => getSelectedUniversityName(selectedUniversity),
    [selectedUniversity],
  );

  useEffect(() => {
    const parsedVersionId = Number(versionId);

    if (!Number.isFinite(parsedVersionId) || parsedVersionId <= 0) {
      toast.error('La version solicitada no es valida.');
      navigate('/usuario/universidad/generar-horario', { replace: true });
      return;
    }

    loadVersionDetail(parsedVersionId);
  }, [loadVersionDetail, navigate, versionId]);

  useEffect(() => {
    if (!selectedVersion) {
      setSelectedGroupId(null);
      return;
    }

    const groups = Array.isArray(selectedVersion?.data?.groups) ? selectedVersion.data.groups : [];
    if (!groups.length) {
      setSelectedGroupId(null);
      return;
    }

    const hasSelectedGroup = groups.some((group) => Number(group?.group_id) === Number(selectedGroupId));
    if (!hasSelectedGroup) {
      setSelectedGroupId(groups[0].group_id);
    }
  }, [selectedGroupId, selectedVersion]);

  useEffect(() => {
    if (!historyError) {
      return;
    }

    toast.error(historyError, { id: 'schedule-generator-detail-error' });
    setHistoryError(null);
  }, [historyError, setHistoryError]);

  useEffect(() => {
    const originalTitle = document.title;
    const browserWindow = globalThis.window;

    if (!browserWindow) {
      return undefined;
    }

    const handleBeforePrint = () => {
      document.title = '';
    };

    const handleAfterPrint = () => {
      document.title = originalTitle;
    };

    browserWindow.addEventListener('beforeprint', handleBeforePrint);
    browserWindow.addEventListener('afterprint', handleAfterPrint);

    return () => {
      browserWindow.removeEventListener('beforeprint', handleBeforePrint);
      browserWindow.removeEventListener('afterprint', handleAfterPrint);
      document.title = originalTitle;
    };
  }, []);

  const handleToggleViewConfig = (key, value) => {
    setViewConfig((prev) => ({
      ...prev,
      [key]: Boolean(value),
    }));
  };

  const handleConfirmVersion = async () => {
    const currentVersionId = selectedVersion?.id;
    if (!currentVersionId) {
      return;
    }

    const result = await confirmVersionById(currentVersionId);
    if (!result?.success) {
      if (!result?.deduped) {
        toast.error(result?.message || 'No se pudo confirmar la version.');
      }
      return;
    }

    toast.success(result?.message || 'Version confirmada correctamente.');
    setConfirmModalOpen(false);
  };

  const handleRegenerateSchedule = async () => {
    const result = await generateScheduleVersion();
    if (!result?.success) {
      if (!result?.deduped) {
        toast.error(result?.message || 'No se pudo generar nuevamente el borrador.');
      }
      return;
    }

    const generatedVersionId = Number(result?.data?.id);
    if (Number.isFinite(generatedVersionId) && generatedVersionId > 0 && generatedVersionId !== Number(versionId)) {
      navigate(`/usuario/universidad/generar-horario/ver/${generatedVersionId}`, { replace: true });
    }

    toast.success(result?.message || 'Borrador regenerado correctamente.');
    setRegenerateModalOpen(false);
  };

  const handleExportPdf = () => {
    toast('Exportacion PDF pendiente de implementacion.');
  };

  const isDraftVersion = Boolean(selectedVersion) && Number(selectedVersion?.is_confirmed) !== 1;
  const isRegenerating = pendingAction?.type === 'generate';

  return (
    <div className="space-y-6">
      <SurfacePanel className="overflow-hidden" padding="p-0">
        <div
          className="no-print flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
          style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
        >
          <div>
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Detalle de Horario
            </h2>
            <p className="mt-1 text-base" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Contexto: {selectedUniversityName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isDraftVersion ? (
              <ActionButton
                icon={Sparkles}
                label="Generar nuevamente"
                variant="outline"
                fullWidth={false}
                onClick={() => setRegenerateModalOpen(true)}
                loading={isRegenerating}
                loadingLabel="Generando..."
                disabled={Boolean(pendingAction?.type) && !isRegenerating}
              />
            ) : null}

            <ActionButton
              icon={ArrowLeft}
              label="Volver al historial"
              variant="secondary"
              fullWidth={false}
              onClick={() => navigate('/usuario/universidad/generar-horario')}
            />
          </div>
        </div>

        <div className="print-schedule-content px-5 py-4">
          <ScheduleGeneratedPanel
            loading={selectedVersionLoading}
            scheduleVersion={selectedVersion}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            userUniversityName={selectedUniversityName}
            pendingAction={pendingAction}
            onRequestConfirmVersion={() => setConfirmModalOpen(true)}
            onExportPdf={handleExportPdf}
            viewConfig={viewConfig}
            onToggleViewConfig={handleToggleViewConfig}
          />
        </div>
      </SurfacePanel>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmVersion}
        title="Confirmar version"
        message={`¿Deseas confirmar la version "${selectedVersion?.label || 'Seleccionada'}"?`}
        confirmLabel="Confirmar"
        closeOnConfirm={false}
      />

      <ConfirmModal
        isOpen={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        onConfirm={handleRegenerateSchedule}
        title="Generar nuevamente"
        message="Al volver a generar se perderan todas las configuraciones actuales del borrador. ¿Deseas continuar?"
        confirmLabel="Generar nuevamente"
        closeOnConfirm={false}
      />
    </div>
  );
};
