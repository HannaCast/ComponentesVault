import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { UniversityForm } from './UniversityForm';
import { UniversityScreenShell } from './UniversityScreenShell';
import { useUniversities } from '../hooks/useUniversities';
import { parseUniversityApiError } from '../utils/parseUniversityApiError';

const createInitialSaveModalState = () => ({
  isOpen: false,
  payload: null,
  logoFile: null,
  removeLogo: false,
  saveKind: 'create',
  universityId: null,
});

const getSaveFallbackMessage = (isEditSave) => {
  if (isEditSave) {
    return 'No se pudo actualizar la universidad.';
  }
  return 'No se pudo crear la universidad.';
};

const loadInitialUniversityData = async ({
  mode,
  universityId,
  shouldRunCatalog,
  fetchPeriodTypes,
  fetchUniversityProfile,
  clearUniversityProfile,
  onCreateReady,
  onEditReady,
  isCancelled,
}) => {
  const signature = buildRequestSignature({ resource: 'period-types' }, ['resource']);
  if (shouldRunCatalog(signature)) {
    await fetchPeriodTypes();
  }

  if (isCancelled()) {
    return;
  }

  if (mode === 'create') {
    clearUniversityProfile();
    onCreateReady();
    return;
  }

  if (mode === 'edit' && universityId) {
    await fetchUniversityProfile(universityId);
    if (!isCancelled()) {
      onEditReady();
    }
  }
};

const createCancellationGuard = (isCancelled, callback) => (value) => {
  if (isCancelled()) {
    return;
  }
  callback(value);
};

const buildUniversityFormViewState = ({
  mode,
  universityProfile,
  editFormKey,
  formResetKey,
  updateLoading,
  createLoading,
}) => {
  const isEditMode = mode === 'edit';

  return {
    key: isEditMode
      ? `edit-${universityProfile?.id}-${editFormKey}`
      : `create-${formResetKey}`,
    initialProfile: isEditMode ? universityProfile : null,
    isLoading: isEditMode ? updateLoading : createLoading,
  };
};

const getSaveModalViewText = (saveKind) => {
  if (saveKind === 'edit') {
    return {
      title: 'Confirmar cambios',
      message: '¿Deseas guardar los cambios de esta universidad?',
      confirmLabel: 'Guardar',
    };
  }

  return {
    title: 'Confirmar creación',
    message: '¿Deseas crear esta universidad con la información capturada?',
    confirmLabel: 'Crear',
  };
};

const persistUniversitySave = async ({
  saveModal,
  updateUniversityFullSetup,
  createUniversityFullSetup,
  closeSaveModal,
  goToView,
  goToEdit,
  goToList,
}) => {
  const {
    payload,
    logoFile,
    removeLogo,
    saveKind,
    universityId: uid,
  } = saveModal;

  if (payload == null) {
    return;
  }

  const isEditSave = saveKind === 'edit' && uid;

  try {
    if (isEditSave) {
      await updateUniversityFullSetup(uid, payload, logoFile, removeLogo);
      toast.success('Universidad actualizada correctamente');
      closeSaveModal();
      goToView(uid);
      return;
    }

    const response = await createUniversityFullSetup(payload, logoFile);
    toast.success('Universidad creada correctamente. Ahora agrega modalidades, turnos y periodos.');
    closeSaveModal();
    const newId = response?.data?.data?.university_id;
    if (newId == null) {
      goToList();
      return;
    }

    goToEdit(newId);
  } catch (err) {
    console.error(err);
    const fallback = getSaveFallbackMessage(Boolean(isEditSave));
    toast.error(parseUniversityApiError(err, fallback));
  }
};

export const UniversityFormPageContainer = ({ mode, universityId }) => {
  const navigate = useNavigate();
  const [formResetKey, setFormResetKey] = useState(0);
  const [editFormKey, setEditFormKey] = useState(0);
  const [saveModal, setSaveModal] = useState(createInitialSaveModalState);

  const { shouldRun: shouldRunCatalog } = useRequestDeduper({ windowMs: 300 });

  const {
    periodTypeOptions,
    fetchPeriodTypes,
    createUniversityFullSetup,
    updateUniversityFullSetup,
    createLoading,
    updateLoading,
    universityProfile,
    profileLoading,
    fetchUniversityProfile,
    clearUniversityProfile,
  } = useUniversities();

  const goToList = useCallback(() => {
    navigate('/usuario/universidades');
  }, [navigate]);

  const goToView = useCallback((id) => {
    navigate(`/usuario/universidades/${id}`);
  }, [navigate]);

  const goToEdit = useCallback((id) => {
    navigate(`/usuario/universidades/${id}/editar`);
  }, [navigate]);

  const closeSaveModal = useCallback(() => {
    setSaveModal(createInitialSaveModalState());
  }, []);

  const handleCreateReady = useCallback(() => {
    setFormResetKey((key) => key + 1);
  }, []);

  const handleEditReady = useCallback(() => {
    setEditFormKey((key) => key + 1);
  }, []);

  const handleInitialLoadError = useCallback((err) => {
    console.error(err);
    toast.error('No se pudieron cargar los datos necesarios. Intenta de nuevo.');
    goToList();
  }, [goToList]);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    const handleLoadFailure = createCancellationGuard(isCancelled, handleInitialLoadError);

    loadInitialUniversityData({
      mode,
      universityId,
      shouldRunCatalog,
      fetchPeriodTypes,
      fetchUniversityProfile,
      clearUniversityProfile,
      onCreateReady: handleCreateReady,
      onEditReady: handleEditReady,
      isCancelled,
    }).catch(handleLoadFailure);

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    universityId,
    fetchPeriodTypes,
    fetchUniversityProfile,
    clearUniversityProfile,
    shouldRunCatalog,
    handleCreateReady,
    handleEditReady,
    handleInitialLoadError,
  ]);

  const shellTitle = mode === 'create' ? 'Nueva Universidad' : 'Editar universidad';
  const shellSubtitle = useMemo(
    () => (mode === 'create' ? null : (universityProfile?.short_name || universityProfile?.name || null)),
    [mode, universityProfile?.name, universityProfile?.short_name],
  );

  const handleFormSubmit = ({ payload, logoFile, removeLogo }) => {
    const isEdit = mode === 'edit';
    setSaveModal({
      isOpen: true,
      payload,
      logoFile,
      removeLogo: Boolean(removeLogo),
      saveKind: isEdit ? 'edit' : 'create',
      universityId: isEdit ? universityProfile?.id : null,
    });
  };

  const handleConfirmSave = useCallback(async () => {
    await persistUniversitySave({
      saveModal,
      updateUniversityFullSetup,
      createUniversityFullSetup,
      closeSaveModal,
      goToView,
      goToEdit,
      goToList,
    });
  }, [
    saveModal,
    updateUniversityFullSetup,
    closeSaveModal,
    goToView,
    goToEdit,
    createUniversityFullSetup,
    goToList,
  ]);

  const isEditMode = mode === 'edit';
  const isEditReady = Boolean(
    isEditMode
      && universityProfile?.id
      && Number(universityProfile.id) === Number(universityId),
  );
  const isEditPendingProfile = isEditMode && isEditReady === false;
  const showForm = mode === 'create' || isEditReady;
  const showLoader = isEditPendingProfile && profileLoading;
  const showNotFoundMessage = isEditPendingProfile && profileLoading === false;
  const formViewState = buildUniversityFormViewState({
    mode,
    universityProfile,
    editFormKey,
    formResetKey,
    updateLoading,
    createLoading,
  });
  const saveModalViewText = getSaveModalViewText(saveModal.saveKind);

  return (
    <>
      <UniversityScreenShell
        onBack={goToList}
        title={shellTitle}
        subtitle={shellSubtitle}
      >
        {showLoader && (
          <LoadingStatePanel message="Cargando datos de la universidad..." />
        )}
        {showNotFoundMessage && (
          <p className="text-sm text-[var(--text-secondary)]">
            No se encontró la universidad o no tienes acceso.
          </p>
        )}
        {showForm && (
          <UniversityForm
            key={formViewState.key}
            mode={mode}
            initialProfile={formViewState.initialProfile}
            periodTypeOptions={periodTypeOptions}
            isLoading={formViewState.isLoading}
            onSubmit={handleFormSubmit}
            onCancel={goToList}
          />
        )}
      </UniversityScreenShell>

      <ConfirmModal
        isOpen={saveModal.isOpen}
        onClose={closeSaveModal}
        onConfirm={handleConfirmSave}
        title={saveModalViewText.title}
        message={saveModalViewText.message}
        confirmLabel={saveModalViewText.confirmLabel}
        closeOnConfirm
      />
    </>
  );
};

UniversityFormPageContainer.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  universityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
