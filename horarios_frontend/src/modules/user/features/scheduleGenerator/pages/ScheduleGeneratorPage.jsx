import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { getSelectedUniversityDisplayName } from '@shared/utils/universityContext';
import { getScheduleVersionsPaginated } from '../api/scheduleGeneratorApi';
import { ScheduleGenerationOptionsModal } from '../components/ScheduleGenerationOptionsModal';
import { ScheduleVersionHistoryPanel } from '../components/ScheduleVersionHistoryPanel';
import { TeacherAvailabilityErrorModal } from '../components/TeacherAvailabilityErrorModal';
import { useScheduleGenerator } from '../hooks/useScheduleGenerator';

const PAGE_SIZE = 6;

const getContextLabel = (selectedUniversityName, activeAcademicPeriodName, usesPeriodGroups) => {
  if (!usesPeriodGroups || !activeAcademicPeriodName) {
    return `Contexto: ${selectedUniversityName}`;
  }

  return `Contexto: ${selectedUniversityName} | Periodo: ${activeAcademicPeriodName}`;
};

export const ScheduleGeneratorPage = () => {
  const { user, restoreSession } = useAuth();
  const navigate = useNavigate();
  const selectedUniversity = user?.selected_university;
  const selectedUniversityId = Number(selectedUniversity?.id) || null;
  const activeAcademicPeriodId = user?.selected_university_active_period_id || null;

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasActiveDraft, setHasActiveDraft] = useState(false);
  const [draftAvailabilityLoading, setDraftAvailabilityLoading] = useState(true);

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, version: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, version: null });
  const [teacherAvailabilityError, setTeacherAvailabilityError] = useState({
    isOpen: false,
    teachers: [],
  });

  const { shouldRun } = useRequestDeduper({ windowMs: 150 });

  const {
    historyItems,
    historyMeta,
    historyLoading,
    historyError,
    setHistoryError,

    pendingAction,
    isMutating,

    fetchHistory,

    generateScheduleVersion,
    confirmVersionById,
    deleteDraftById,
    renameVersionById,
  } = useScheduleGenerator();

  const selectedUniversityName = useMemo(
    () => getSelectedUniversityDisplayName(selectedUniversity, 'Sin universidad seleccionada'),
    [selectedUniversity],
  );

  const activeAcademicPeriodName = useMemo(
    () => String(user?.selected_university_active_period_name || '').trim(),
    [user?.selected_university_active_period_name],
  );

  const contextLabel = useMemo(
    () => getContextLabel(selectedUniversityName, activeAcademicPeriodName),
    [selectedUniversityName, activeAcademicPeriodName],
  );

  const totalPages = Math.max(1, Number(historyMeta?.totalPages) || 1);
  const totalItems = Number(historyMeta?.total) || 0;

  const refreshDraftAvailability = useCallback(async () => {
    if (!selectedUniversityId) {
      setHasActiveDraft(false);
      setDraftAvailabilityLoading(false);
      return;
    }

    setDraftAvailabilityLoading(true);

    try {
      const response = await getScheduleVersionsPaginated({
        page: 1,
        limit: 1,
        confirmed: 0,
      });

      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const hasDraft = rows.some((row) => Number(row?.is_confirmed) === 0);
      setHasActiveDraft(hasDraft);
    } catch (error) {
      console.error('Error al validar borrador activo:', error);
    } finally {
      setDraftAvailabilityLoading(false);
    }
  }, [selectedUniversityId]);

  const handleViewVersion = (versionId) => {
    navigate(`/usuario/universidad/generar-horario/ver/${versionId}`);
  };

  const handleGenerateSchedule = async (parameters) => {
    const result = await generateScheduleVersion(activeAcademicPeriodId, parameters);

    if (!result?.success) {
      if (!result?.deduped) {
        const teachersList = Array.isArray(result?.errorData?.teachers)
          ? result.errorData.teachers
          : [];

        if (teachersList.length > 0) {
          setGenerateModalOpen(false);
          setTeacherAvailabilityError({ isOpen: true, teachers: teachersList });
          return;
        }

        toast.error(result?.message || 'No se pudo generar el horario.');
      }
      return;
    }

    toast.success(result?.message || 'Horario generado correctamente.');
    setGenerateModalOpen(false);
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
    setHasActiveDraft(true);

    try {
      await restoreSession();
    } catch (error) {
      console.error('No se pudo refrescar configuracion del usuario:', error);
    }
  };

  const handleConfirmVersion = async () => {
    const versionId = confirmModal?.version?.id;
    if (!versionId) {
      return;
    }

    const result = await confirmVersionById(versionId);
    if (!result?.success) {
      if (!result?.deduped) {
        toast.error(result?.message || 'No se pudo confirmar la version.');
      }
      return;
    }

    toast.success(result?.message || 'Version confirmada correctamente.');
    setConfirmModal({ isOpen: false, version: null });
    setHasActiveDraft(false);

    try {
      await restoreSession();
    } catch (error) {
      console.error('No se pudo refrescar configuracion del usuario:', error);
    }
  };

  const handleDeleteDraft = async () => {
    const versionId = deleteModal?.version?.id;
    if (!versionId) {
      return;
    }

    const result = await deleteDraftById(versionId);
    if (!result?.success) {
      if (!result?.deduped) {
        toast.error(result?.message || 'No se pudo eliminar el borrador.');
      }
      return;
    }

    toast.success('Borrador eliminado correctamente.');
    setDeleteModal({ isOpen: false, version: null });
    setHasActiveDraft(false);

    try {
      await restoreSession();
    } catch (error) {
      console.error('No se pudo refrescar configuracion del usuario:', error);
    }
  };

  const handleRenameVersion = async (version, nextLabel) => {
    const versionId = version?.id;
    if (!versionId) {
      return { success: false };
    }

    const result = await renameVersionById(versionId, nextLabel);
    if (!result?.success) {
      if (!result?.deduped) {
        toast.error(result?.message || 'No se pudo actualizar el nombre de la version.');
      }
      return { success: false };
    }

    toast.success(result?.message || 'Nombre de version actualizado correctamente.');
    return { success: true };
  };

  const handleExportPdf = () => {
    toast('Exportacion PDF pendiente de implementacion.');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 420);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedUniversityId) {
      return;
    }

    const query = {
      page: currentPage,
      limit: PAGE_SIZE,
      search: searchTerm,
    };

    const querySignature = buildRequestSignature(query, ['page', 'limit', 'search']);
    if (!shouldRun(querySignature)) {
      return;
    }

    fetchHistory(query);
  }, [currentPage, fetchHistory, searchTerm, selectedUniversityId, shouldRun]);

  useEffect(() => {
    refreshDraftAvailability();
  }, [refreshDraftAvailability]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!historyError) {
      return;
    }

    toast.error(historyError, { id: 'schedule-generator-history-error' });
    setHistoryError(null);
  }, [historyError, setHistoryError]);

  return (
    <div className="space-y-6">
      <SurfacePanel className="overflow-hidden" padding="p-0">
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <PageSectionHeader
            title="Generar Horario"
            contextLabel={contextLabel}
            actionIcon={Sparkles}
            actionLabel={!draftAvailabilityLoading && !hasActiveDraft ? 'Generar horario' : null}
            onAction={!draftAvailabilityLoading && !hasActiveDraft ? () => setGenerateModalOpen(true) : null}
            actionLoading={pendingAction?.type === 'generate'}
            actionLoadingLabel="Generando..."
            actionDisabled={isMutating && pendingAction?.type !== 'generate'}
            actionVariant="outline"
          />
        </div>

        <div className="px-5 py-4">
          <ScheduleVersionHistoryPanel
            versions={historyItems}
            loading={historyLoading}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onViewVersion={handleViewVersion}
            onRenameVersion={handleRenameVersion}
            onConfirmVersion={(version) => setConfirmModal({ isOpen: true, version })}
            onDeleteDraft={(version) => setDeleteModal({ isOpen: true, version })}
            onExportPdf={handleExportPdf}
            pendingAction={pendingAction}
            actionsDisabled={isMutating}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage: PAGE_SIZE,
              onPageChange: setCurrentPage,
            }}
          />
        </div>
      </SurfacePanel>

      <ScheduleGenerationOptionsModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onGenerate={handleGenerateSchedule}
        isGenerating={pendingAction?.type === 'generate'}
        initialParameters={null}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, version: null })}
        onConfirm={handleConfirmVersion}
        title="Confirmar version"
        message={`¿Deseas confirmar la version "${confirmModal?.version?.label || 'Seleccionada'}"?`}
        confirmLabel="Confirmar"
        closeOnConfirm={false}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, version: null })}
        onConfirm={handleDeleteDraft}
        title="Eliminar borrador"
        message={`¿Deseas eliminar el borrador "${deleteModal?.version?.label || 'Seleccionado'}"?`}
        confirmLabel="Eliminar"
        closeOnConfirm={false}
      />

      <TeacherAvailabilityErrorModal
        isOpen={teacherAvailabilityError.isOpen}
        onClose={() => setTeacherAvailabilityError({ isOpen: false, teachers: [] })}
        teachers={teacherAvailabilityError.teachers}
      />
    </div>
  );
};
