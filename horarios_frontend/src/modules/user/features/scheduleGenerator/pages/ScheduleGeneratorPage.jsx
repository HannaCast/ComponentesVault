import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SelectedUniversityAlert } from '@shared/components/layout/SelectedUniversityAlert';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { ScheduleVersionHistoryPanel } from '../components/ScheduleVersionHistoryPanel';
import { useScheduleGenerator } from '../hooks/useScheduleGenerator';

const PAGE_SIZE = 6;

const getSelectedUniversityName = (selectedUniversity) => {
  if (!selectedUniversity) {
    return 'Sin universidad seleccionada';
  }

  if (typeof selectedUniversity === 'string') {
    return selectedUniversity;
  }

  return selectedUniversity.short_name || selectedUniversity.name || 'Universidad seleccionada';
};

const getContextLabel = (selectedUniversityName) => `Contexto: ${selectedUniversityName}`;

export const ScheduleGeneratorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const selectedUniversity = user?.selected_university;

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, version: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, version: null });

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
    () => getSelectedUniversityName(selectedUniversity),
    [selectedUniversity],
  );

  const contextLabel = useMemo(
    () => getContextLabel(selectedUniversityName),
    [selectedUniversityName],
  );

  const totalPages = Math.max(1, Number(historyMeta?.totalPages) || 1);
  const totalItems = Number(historyMeta?.total) || 0;

  const handleViewVersion = (versionId) => {
    navigate(`/usuario/universidad/generar-horario/ver/${versionId}`);
  };

  const handleGenerateSchedule = async () => {
    const result = await generateScheduleVersion();

    if (!result?.success) {
      if (!result?.deduped) {
        toast.error(result?.message || 'No se pudo generar el horario.');
      }
      return;
    }

    toast.success(result?.message || 'Horario generado correctamente.');
    setGenerateModalOpen(false);
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
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
    if (!selectedUniversity) {
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
  }, [currentPage, fetchHistory, searchTerm, selectedUniversity, shouldRun]);

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

  if (!selectedUniversity) {
    return <SelectedUniversityAlert />;
  }

  return (
    <div className="space-y-6">
      <SurfacePanel className="overflow-hidden" padding="p-0">
        <div
          className="flex flex-col gap-4 border-b px-5 py-4 xl:flex-row xl:items-start xl:justify-between"
          style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
        >
          <div>
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Generar Horario
            </h2>
            <p className="mt-1 text-base" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              {contextLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <ActionButton
              icon={Sparkles}
              label="Generar horario"
              variant="outline"
              fullWidth={false}
              onClick={() => setGenerateModalOpen(true)}
              loading={pendingAction?.type === 'generate'}
              loadingLabel="Generando..."
              disabled={isMutating && pendingAction?.type !== 'generate'}
            />
          </div>
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

      <ConfirmModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onConfirm={handleGenerateSchedule}
        title="Generar horario"
        message="Se regenerara el borrador activo con los datos institucionales del backend. ¿Deseas continuar?"
        confirmLabel="Generar"
        closeOnConfirm={false}
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
    </div>
  );
};
