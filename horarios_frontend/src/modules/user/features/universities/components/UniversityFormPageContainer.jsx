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

export const UniversityFormPageContainer = ({ mode, universityId }) => {
  const navigate = useNavigate();
  const [formResetKey, setFormResetKey] = useState(0);
  const [editFormKey, setEditFormKey] = useState(0);
  const [saveModal, setSaveModal] = useState({
    isOpen: false,
    payload: null,
    logoFile: null,
    saveKind: 'create',
    universityId: null,
  });

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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const sig = buildRequestSignature({ resource: 'period-types' }, ['resource']);
        if (shouldRunCatalog(sig)) {
          await fetchPeriodTypes();
        }
        if (cancelled) {
          return;
        }
        if (mode === 'create') {
          clearUniversityProfile();
          setFormResetKey((k) => k + 1);
        } else if (universityId) {
          await fetchUniversityProfile(universityId);
          if (!cancelled) {
            setEditFormKey((k) => k + 1);
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          toast.error('No se pudieron cargar los datos necesarios. Intenta de nuevo.');
          goToList();
        }
      }
    };

    run();
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
    goToList,
  ]);

  const shellTitle = mode === 'create' ? 'Nueva Universidad' : 'Editar universidad';
  const shellSubtitle = useMemo(() => {
    if (mode === 'create') {
      return null;
    }
    return universityProfile?.short_name || universityProfile?.name || null;
  }, [mode, universityProfile?.name, universityProfile?.short_name]);

  const handleFormSubmit = ({ payload, logoFile }) => {
    const isEdit = mode === 'edit';
    setSaveModal({
      isOpen: true,
      payload,
      logoFile,
      saveKind: isEdit ? 'edit' : 'create',
      universityId: isEdit ? universityProfile?.id : null,
    });
  };

  const handleConfirmSave = async () => {
    const {
      payload,
      logoFile,
      saveKind,
      universityId: uid,
    } = saveModal;
    if (!payload) {
      return;
    }

    try {
      if (saveKind === 'edit' && uid) {
        await updateUniversityFullSetup(uid, payload, logoFile);
        toast.success('Universidad actualizada correctamente');
        setSaveModal({
          isOpen: false,
          payload: null,
          logoFile: null,
          saveKind: 'create',
          universityId: null,
        });
        goToView(uid);
      } else {
        const response = await createUniversityFullSetup(payload, logoFile);
        toast.success('Universidad creada correctamente');
        setSaveModal({
          isOpen: false,
          payload: null,
          logoFile: null,
          saveKind: 'create',
          universityId: null,
        });
        const newId = response?.data?.data?.university_id;
        if (newId != null) {
          goToView(newId);
        } else {
          goToList();
        }
      }
    } catch (err) {
      console.error(err);
      const fallback = saveKind === 'edit'
        ? 'No se pudo actualizar la universidad.'
        : 'No se pudo crear la universidad.';
      toast.error(parseUniversityApiError(err, fallback));
    }
  };

  const editReady = mode === 'edit' && universityProfile?.id && Number(universityProfile.id) === Number(universityId);
  const showForm = mode === 'create' || editReady;
  const showLoader = mode === 'edit' && profileLoading && !editReady;

  return (
    <>
      <UniversityScreenShell
        onBack={goToList}
        title={shellTitle}
        subtitle={shellSubtitle}
      >
        {showLoader ? (
          <LoadingStatePanel message="Cargando datos de la universidad..." />
        ) : null}
        {mode === 'edit' && !profileLoading && !editReady ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No se encontró la universidad o no tienes acceso.
          </p>
        ) : null}
        {showForm ? (
          <UniversityForm
            key={
              mode === 'edit'
                ? `edit-${universityProfile?.id}-${editFormKey}`
                : `create-${formResetKey}`
            }
            mode={mode}
            initialProfile={mode === 'edit' ? universityProfile : null}
            periodTypeOptions={periodTypeOptions}
            isLoading={mode === 'edit' ? updateLoading : createLoading}
            onSubmit={handleFormSubmit}
            onCancel={goToList}
          />
        ) : null}
      </UniversityScreenShell>

      <ConfirmModal
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({
          isOpen: false,
          payload: null,
          logoFile: null,
          saveKind: 'create',
          universityId: null,
        })}
        onConfirm={handleConfirmSave}
        title={saveModal.saveKind === 'edit' ? 'Confirmar cambios' : 'Confirmar creación'}
        message={
          saveModal.saveKind === 'edit'
            ? '¿Deseas guardar los cambios de esta universidad?'
            : '¿Deseas crear esta universidad con la información capturada?'
        }
        confirmLabel={saveModal.saveKind === 'edit' ? 'Guardar' : 'Crear'}
        closeOnConfirm
      />
    </>
  );
};

UniversityFormPageContainer.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  universityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
