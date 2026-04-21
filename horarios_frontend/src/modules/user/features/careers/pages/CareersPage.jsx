import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, GraduationCap, Pencil, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { getSelectedUniversityDisplayName } from '@shared/utils/universityContext';
import { CareerDetail } from '../components/CareerDetail';
import { CareerForm } from '../components/CareerForm';
import { useCareers } from '../hooks/useCareers';

const orderOptions = [
  { value: 'asc', label: 'A-Z' },
  { value: 'desc', label: 'Z-A' },
];

const getDrawerTitle = (mode, selectedCareer) => {
  if (mode === 'create') return 'Nueva Carrera';
  if (mode === 'edit') return 'Editar Carrera';
  return selectedCareer?.name || 'Detalle';
};

const getDrawerHeaderIcon = (mode) => {
  if (mode === 'create') return Plus;
  if (mode === 'edit') return Pencil;
  return Eye;
};

const getDrawerHeaderBadge = (mode) => {
  if (mode === 'create') return 'Crear';
  if (mode === 'edit') return 'Editar';
  return 'Ver';
};

const getSaveModalContent = (mode) => {
  if (mode === 'edit') {
    return {
      title: 'Confirmar guardado',
      message: '¿Deseas guardar los cambios de esta carrera?',
      confirmLabel: 'Guardar',
    };
  }

  return {
    title: 'Confirmar creación',
    message: '¿Deseas crear esta carrera con la información capturada?',
    confirmLabel: 'Crear',
  };
};

const getEmptyState = (searchTerm, estadoFiltro, onCreate) => {
  const isDefaultState = !searchTerm && estadoFiltro === 'todos';

  if (isDefaultState) {
    return {
      icon: GraduationCap,
      title: 'No hay carreras registradas',
      description: 'Comienza agregando tu primera carrera',
      actionIcon: Plus,
      actionLabel: 'Nueva Carrera',
      onAction: onCreate,
    };
  }

  return {
    icon: GraduationCap,
    title: 'No se encontraron carreras',
    description: 'Intenta con otros términos de búsqueda o filtros',
    actionIcon: undefined,
    actionLabel: undefined,
    onAction: undefined,
  };
};

const getToggleModalContent = (isCurrentlyActive) => {
  if (isCurrentlyActive) {
    return {
      title: 'Desactivar carrera',
      message: 'Al desactivar esta carrera no se tomará en cuenta para el sistema. ¿Deseas continuar?',
      confirmLabel: 'Desactivar',
    };
  }

  return {
    title: 'Activar carrera',
    message: 'Esta carrera volverá a considerarse activa en el sistema. ¿Deseas continuar?',
    confirmLabel: 'Activar',
  };
};

export const CareersPage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunModalitiesRequest } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [rowActionState, setRowActionState] = useState({ careerId: null, action: null });
  const [isOpeningCreate, setIsOpeningCreate] = useState(false);
  const [saveModal, setSaveModal] = useState({
    isOpen: false,
    mode: 'create',
    formData: null,
  });
  const [toggleModal, setToggleModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    isCurrentlyActive: false,
  });

  const {
    careersPage,
    totalItems,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    ordenAscendente,
    setOrdenAscendente,
    modalidadFiltro,
    setModalidadFiltro,
    deleteModal,
    setDeleteModal,
    statusOptions,
    modalitiesOptions,
    fetchModalitiesOptions,
    fetchCareers,
    handleToggleStatus,
    handleDelete,
    selectedCareer,
    setSelectedCareer,
    careerLoading,
    fetchCareerById,
    handleCreateCareer,
    handleUpdateCareer,
  } = useCareers();

  const selectedUniversity = user?.selected_university;
  const selectedUniversityName = getSelectedUniversityDisplayName(selectedUniversity, '');
  const selectedUniversityId = selectedUniversity?.id;
  const draftScheduleUniversityIds = user?.schedule_generation?.draft_schedule_university_ids;
  const hasDraftScheduleInProgress = selectedUniversityId !== null
    && selectedUniversityId !== undefined
    && selectedUniversityId !== ''
    && Array.isArray(draftScheduleUniversityIds)
    && draftScheduleUniversityIds.some(
      (universityId) => String(universityId) === String(selectedUniversityId),
    );
  const scheduleDraftNotice = hasDraftScheduleInProgress
    ? 'Actualmente se esta gestionando una version de horario de una universidad.'
    : null;

  const contextLabel = selectedUniversityName
    ? `Carreras de: ${selectedUniversityName}`
    : 'Carreras';

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isAnyRowActionRunning = rowActionState.careerId !== null;
  const toggleModalContent = getToggleModalContent(toggleModal.isCurrentlyActive);
  const saveModalContent = getSaveModalContent(saveModal.mode);

  const filteredCareers = useMemo(() => {
    if (!modalidadFiltro || modalidadFiltro === 'todas') {
      return careersPage;
    }

    const opt = modalitiesOptions.find((o) => String(o.value) === String(modalidadFiltro));
    if (!opt) {
      return careersPage;
    }

    return careersPage.filter((career) => String(career.modality) === opt.label);
  }, [careersPage, modalidadFiltro, modalitiesOptions]);

  const runRowAction = async (careerId, action, task) => {
    if (isAnyRowActionRunning) return;
    setRowActionState({ careerId, action });
    try {
      await task();
    } finally {
      setRowActionState({ careerId: null, action: null });
    }
  };

  const loadModalitiesOptions = useCallback(async () => {
    const signature = buildRequestSignature(
      {
        resource: 'careers-modalities',
        selectedUniversityId,
      },
      ['resource', 'selectedUniversityId'],
    );

    if (!shouldRunModalitiesRequest(signature)) {
      return;
    }

    await fetchModalitiesOptions();
  }, [selectedUniversityId, shouldRunModalitiesRequest, fetchModalitiesOptions]);

  async function handleOpenDrawerCreate() {
    if (isOpeningCreate) return;

    setIsOpeningCreate(true);
    try {
      await loadModalitiesOptions();
      setDrawerMode('create');
      setSelectedCareer(null);
      setDrawerOpen(true);
    } finally {
      setIsOpeningCreate(false);
    }
  }

  const handleOpenDrawerView = async (id) => {
    await runRowAction(id, 'view', async () => {
      setDrawerMode('view');
      const careerData = await fetchCareerById(id);
      if (careerData) {
        setDrawerOpen(true);
      }
    });
  };

  const handleOpenDrawerEdit = async (id) => {
    await runRowAction(id, 'edit', async () => {
      setDrawerMode('edit');
      await loadModalitiesOptions();
      const careerData = await fetchCareerById(id);
      if (careerData) {
        setDrawerOpen(true);
      }
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setSelectedCareer(null);
    setSaveModal({ isOpen: false, mode: 'create', formData: null });
  };

  const handleDrawerEditClick = async () => {
    if (selectedCareer) {
      await loadModalitiesOptions();
      setDrawerMode('edit');
    }
  };

  const handleFormSubmit = (formData) => {
    setSaveModal({
      isOpen: true,
      mode: drawerMode === 'edit' ? 'edit' : 'create',
      formData,
    });
  };

  const handleConfirmSave = async () => {
    const pendingData = saveModal.formData;
    const pendingMode = saveModal.mode;

    if (!pendingData) {
      return;
    }

    try {
      if (pendingMode === 'create') {
        const created = await handleCreateCareer(pendingData);
        if (created) {
          toast.success('Carrera creada exitosamente');
          handleCloseDrawer();
        }
      } else if (pendingMode === 'edit' && selectedCareer?.id) {
        const updated = await handleUpdateCareer(selectedCareer.id, pendingData);
        if (updated) {
          toast.success('Carrera actualizada exitosamente');
          handleCloseDrawer();
        }
      }
    } catch (err) {
      console.error('Error al guardar carrera:', err);
    }
  };

  const emptyState = getEmptyState(searchTerm, estadoFiltro, handleOpenDrawerCreate);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }
    pageChangeTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setSearchTerm(value);
    }, 350);
  };

  const handleEstadoChange = (event) => {
    const value = event?.target?.value;
    setCurrentPage(1);
    setEstadoFiltro(value);
  };

  const handleModalidadChange = (event) => {
    const value = event?.target?.value;
    setModalidadFiltro(value);
  };

  const handleOrderChange = (event) => {
    const value = event?.target?.value;
    setCurrentPage(1);
    setOrdenAscendente(value === 'asc');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenToggleModal = (career) => {
    setToggleModal({
      isOpen: true,
      id: career.id,
      name: career.name || 'la carrera',
      isCurrentlyActive: Number(career.status) === 1,
    });
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleModal.id) return;

    const wasActive = toggleModal.isCurrentlyActive;
    await runRowAction(toggleModal.id, 'toggle', async () => {
      await handleToggleStatus(toggleModal.id);
    });
    toast.success(`Carrera ${wasActive ? 'desactivada' : 'activada'} exitosamente`);
  };

  const handleConfirmDelete = async () => {
    await runRowAction(deleteModal.id, 'delete', async () => {
      await handleDelete();
    });
    toast.success('Carrera eliminada correctamente');
  };

  useEffect(() => {
    if (!user?.selected_university) {
      return;
    }

    loadModalitiesOptions();
  }, [user?.selected_university, loadModalitiesOptions]);

  useEffect(() => {
    if (!user?.selected_university) {
      return;
    }

    const signature = buildRequestSignature(
      { resource: 'careers', page: currentPage, searchTerm, estadoFiltro, ordenAscendente },
      ['resource', 'page', 'searchTerm', 'estadoFiltro', 'ordenAscendente'],
    );

    if (!shouldRun(signature)) {
      return;
    }

    fetchCareers({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm,
      estado: estadoFiltro,
      asc: ordenAscendente,
    });
  }, [
    user?.selected_university,
    currentPage,
    searchTerm,
    estadoFiltro,
    ordenAscendente,
    fetchCareers,
    ITEMS_PER_PAGE,
    shouldRun,
  ]);

  useEffect(() => {
    if (error) {
      if (drawerOpen && drawerMode !== 'view') {
        return;
      }
      toast.error(error);
      setError(null);
    }
  }, [error, setError, drawerOpen, drawerMode]);

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Carreras"
        contextLabel={contextLabel}
        contextNotice={scheduleDraftNotice}
        actionIcon={Plus}
        actionLabel="Nueva Carrera"
        actionLoading={isOpeningCreate}
        actionLoadingLabel="Cargando..."
        actionDisabled={isOpeningCreate}
        onAction={handleOpenDrawerCreate}
        actionVariant="primary"
      />

      <SurfacePanel padding="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <Input
                  label="Buscar Carrera"
                  placeholder="Nombre o nombre corto"
                  value={searchInput}
                  onChange={handleSearchChange}
                  reserveHelperSpace={false}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Estado"
                  options={statusOptions}
                  value={estadoFiltro}
                  onChange={handleEstadoChange}
                  showPlaceholderOption={false}
                  reserveHelperSpace={false}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Modalidad"
                  options={[
                    { value: 'todas', label: 'Todas' },
                    ...modalitiesOptions,
                  ]}
                  value={modalidadFiltro}
                  onChange={handleModalidadChange}
                  showPlaceholderOption={false}
                  reserveHelperSpace={false}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Orden"
                  options={orderOptions}
                  value={ordenAscendente ? 'asc' : 'desc'}
                  onChange={handleOrderChange}
                  showPlaceholderOption={false}
                  reserveHelperSpace={false}
                />
              </div>
            </div>
          </SurfacePanel>

          <EntityListStateRenderer
            loading={loading}
            loadingMessage="Cargando carreras..."
            items={filteredCareers}
            emptyState={emptyState}
            listPanelPadding="p-0"
            getItemKey={(career) => career.id}
            renderItem={(career, index) => (
              <EntityListItem
                icon={GraduationCap}
                title={career.name}
                subtitle={`Código: ${career.code || '—'}`}
                metaItems={[
                  career.modality ? `Modalidad: ${career.modality}` : null,
                  career.total_periods ? `${career.total_periods} periodos` : null,
                ]}
                isActive={Number(career.status) === 1}
                onToggleStatus={() => handleOpenToggleModal(career)}
                onView={() => handleOpenDrawerView(career.id)}
                onEdit={() => handleOpenDrawerEdit(career.id)}
                onDelete={() => setDeleteModal({ isOpen: true, id: career.id, name: career.name })}
                showBottomBorder={index !== filteredCareers.length - 1}
                loadingAction={
                  rowActionState.careerId === career.id ? rowActionState.action : null
                }
                actionsDisabled={isAnyRowActionRunning && rowActionState.careerId !== career.id}
              />
            )}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage: ITEMS_PER_PAGE,
              onPageChange: handlePageChange,
              hasPreviousPage: currentPage > 1,
              hasNextPage: currentPage < totalPages,
            }}
          />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={getDrawerTitle(drawerMode, selectedCareer)}
        size="lg"
        headerIcon={getDrawerHeaderIcon(drawerMode)}
        headerBadge={getDrawerHeaderBadge(drawerMode)}
      >
        {drawerMode === 'view' ? (
          <CareerDetail
            career={selectedCareer}
            periodExceptions={selectedCareer?.period_exceptions || []}
            periodExceptionsLoading={careerLoading}
            onClose={handleCloseDrawer}
            onEdit={handleDrawerEditClick}
          />
        ) : (
          <CareerForm
            initialData={selectedCareer}
            isLoading={careerLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode={drawerMode}
            modalityOptions={modalitiesOptions}
            careerId={selectedCareer?.id}
            periodExceptions={selectedCareer?.period_exceptions || []}
            periodExceptionsLoading={careerLoading}
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({ isOpen: false, mode: 'create', formData: null })}
        onConfirm={handleConfirmSave}
        title={saveModalContent.title}
        message={saveModalContent.message}
        confirmLabel={saveModalContent.confirmLabel}
        closeOnConfirm
      />

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        title={toggleModalContent.title}
        message={toggleModalContent.message}
        confirmLabel={toggleModalContent.confirmLabel}
        onClose={() => setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false })}
        onConfirm={async () => {
          await handleConfirmToggleStatus();
          setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false });
        }}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Eliminar carrera"
        message={`¿Deseas eliminar ${deleteModal.name || 'esta carrera'}?`}
        confirmLabel="Eliminar"
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
