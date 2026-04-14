import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, Eye, Pencil, Plus } from 'lucide-react';
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
import { ClassroomDetail } from '../components/ClassroomDetail';
import { ClassroomForm } from '../components/ClassroomForm';
import { useClassrooms } from '../hooks/useClassrooms';

const orderOptions = [
  { value: 'asc', label: 'A-Z' },
  { value: 'desc', label: 'Z-A' },
];

const getDrawerTitle = (mode, selectedClassroom) => {
  if (mode === 'create') return 'Nueva Aula';
  if (mode === 'edit') return 'Editar Aula';
  return selectedClassroom?.name || 'Detalle';
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
      message: '¿Deseas guardar los cambios de esta aula?',
      confirmLabel: 'Guardar',
    };
  }

  return {
    title: 'Confirmar creación',
    message: '¿Deseas crear esta aula con la información capturada?',
    confirmLabel: 'Crear',
  };
};

const getEmptyState = (searchTerm, estadoFiltro, tipoFiltro, onCreate) => {
  const isDefaultState = !searchTerm && estadoFiltro === 'todos' && tipoFiltro === 'todos';

  if (isDefaultState) {
    return {
      icon: Building2,
      title: 'No hay aulas registradas',
      description: 'Comienza agregando tu primera aula',
      actionIcon: Plus,
      actionLabel: 'Nueva Aula',
      onAction: onCreate,
    };
  }

  return {
    icon: Building2,
    title: 'No se encontraron aulas',
    description: 'Intenta con otros términos de búsqueda o filtros',
    actionIcon: undefined,
    actionLabel: undefined,
    onAction: undefined,
  };
};

const getToggleModalContent = (isCurrentlyActive) => {
  if (isCurrentlyActive) {
    return {
      title: 'Desactivar aula',
      message: 'Al desactivar esta aula no se tomará en cuenta para el sistema. ¿Deseas continuar?',
      confirmLabel: 'Desactivar',
    };
  }

  return {
    title: 'Activar aula',
    message: 'Esta aula volverá a considerarse activa en el sistema. ¿Deseas continuar?',
    confirmLabel: 'Activar',
  };
};

export const ClassroomsPage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunCatalogRequest } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunClassroomCareersRequest } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [rowActionState, setRowActionState] = useState({ classroomId: null, action: null });
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
    classroomsPage,
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
    tipoFiltro,
    setTipoFiltro,
    deleteModal,
    setDeleteModal,
    statusOptions,
    typeOptions,
    careerOptions,
    fetchTypeOptions,
    fetchCareerOptions,
    fetchClassrooms,
    handleToggleStatus,
    handleDelete,
    selectedClassroom,
    setSelectedClassroom,
    classroomLoading,
    fetchClassroomById,
    handleCreateClassroom,
    handleUpdateClassroom,
    classroomCareerLinks,
    classroomCareersLoading,
    fetchClassroomCareersForClassroom,
    handleAddClassroomCareer,
    handleRemoveClassroomCareer,
    fetchClassroomSubjectPeriodsByCareer,
    fetchClassroomSubjectOptionsByCareerPeriod,
  } = useClassrooms();

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
    ? 'Actualmente se esta gestionando una version de horario de esta universidad.'
    : null;

  const contextLabel = selectedUniversityName
    ? `Aulas de: ${selectedUniversityName}`
    : 'Aulas';

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isAnyRowActionRunning = rowActionState.classroomId !== null;
  const toggleModalContent = getToggleModalContent(toggleModal.isCurrentlyActive);
  const saveModalContent = getSaveModalContent(saveModal.mode);

  const runRowAction = async (classroomId, action, task) => {
    if (isAnyRowActionRunning) return;
    setRowActionState({ classroomId, action });
    try {
      await task();
    } finally {
      setRowActionState({ classroomId: null, action: null });
    }
  };

  async function handleOpenDrawerCreate() {
    if (isOpeningCreate) return;

    setIsOpeningCreate(true);
    try {
      await loadCatalogs();
      setDrawerMode('create');
      setSelectedClassroom(null);
      setDrawerOpen(true);
    } finally {
      setIsOpeningCreate(false);
    }
  }

  const handleOpenDrawerView = async (id) => {
    await runRowAction(id, 'view', async () => {
      setDrawerMode('view');
      const data = await fetchClassroomById(id);
      if (data) {
        setDrawerOpen(true);
      }
    });
  };

  const handleOpenDrawerEdit = async (id) => {
    await runRowAction(id, 'edit', async () => {
      setDrawerMode('edit');
      await loadCatalogs();
      const data = await fetchClassroomById(id);
      if (data) {
        setDrawerOpen(true);
      }
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setSelectedClassroom(null);
    fetchClassroomCareersForClassroom(null);
    setSaveModal({ isOpen: false, mode: 'create', formData: null });
  };

  const handleDrawerEditClick = async () => {
    if (selectedClassroom) {
      await loadCatalogs();
      setDrawerMode('edit');
    }
  };

  const handleFormSubmit = (formPayload) => {
    setSaveModal({
      isOpen: true,
      mode: drawerMode === 'edit' ? 'edit' : 'create',
      formData: formPayload,
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
        const created = await handleCreateClassroom(pendingData);
        if (created) {
          toast.success('Aula creada exitosamente');
          handleCloseDrawer();
        }
      } else if (pendingMode === 'edit' && selectedClassroom?.id) {
        const updated = await handleUpdateClassroom(selectedClassroom.id, pendingData);
        if (updated) {
          toast.success('Aula actualizada exitosamente');
          handleCloseDrawer();
        }
      }
    } catch (err) {
      console.error('Error al guardar aula:', err);
    }
  };

  const handleAddClassroomCareerToast = async (payload) => {
    const ok = await handleAddClassroomCareer(payload);
    if (ok) {
      toast.success('Carrera asignada al aula');
    }
    return ok;
  };

  const handleRemoveClassroomCareerToast = async (linkId, classroomId) => {
    const ok = await handleRemoveClassroomCareer(linkId, classroomId);
    if (ok) {
      toast.success('Carrera quitada del aula');
    }
    return ok;
  };

  const emptyState = getEmptyState(searchTerm, estadoFiltro, tipoFiltro, handleOpenDrawerCreate);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleEstadoChange = (event) => {
    const value = event?.target?.value;
    setCurrentPage(1);
    setEstadoFiltro(value);
  };

  const handleTipoChange = (event) => {
    const value = event?.target?.value;
    setCurrentPage(1);
    setTipoFiltro(value);
  };

  const handleOrderChange = (event) => {
    const value = event?.target?.value;
    setCurrentPage(1);
    setOrdenAscendente(value === 'asc');
  };

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }

    pageChangeTimeoutRef.current = setTimeout(() => {
      setCurrentPage(safePage);
    }, 500);
  };

  const loadCatalogs = useCallback(async () => {
    const signature = buildRequestSignature(
      {
        resource: 'classrooms-catalogs',
        selectedUniversityId,
      },
      ['resource', 'selectedUniversityId'],
    );

    if (!shouldRunCatalogRequest(signature)) {
      return;
    }

    await Promise.all([fetchTypeOptions(), fetchCareerOptions()]);
  }, [
    selectedUniversityId,
    shouldRunCatalogRequest,
    fetchTypeOptions,
    fetchCareerOptions,
  ]);

  const handleOpenToggleModal = (classroom) => {
    setToggleModal({
      isOpen: true,
      id: classroom.id,
      name: classroom.name || 'el aula',
      isCurrentlyActive: Number(classroom.status) === 1,
    });
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleModal.id) return;

    const wasActive = toggleModal.isCurrentlyActive;
    await runRowAction(toggleModal.id, 'toggle', async () => {
      await handleToggleStatus(toggleModal.id);
    });
    toast.success(`Aula ${wasActive ? 'desactivada' : 'activada'} exitosamente`);
  };

  const handleConfirmDelete = async () => {
    await runRowAction(deleteModal.id, 'delete', async () => {
      await handleDelete();
    });
    toast.success('Aula eliminada correctamente');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, setSearchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    return () => {
      if (pageChangeTimeoutRef.current) {
        clearTimeout(pageChangeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.selected_university) {
      return;
    }

    loadCatalogs();
  }, [user?.selected_university, loadCatalogs]);

  useEffect(() => {
    if (!user?.selected_university) {
      return;
    }

    const signature = buildRequestSignature(
      {
        resource: 'classrooms',
        page: currentPage,
        searchTerm,
        estadoFiltro,
        ordenAscendente,
        tipoFiltro,
      },
      ['resource', 'page', 'searchTerm', 'estadoFiltro', 'ordenAscendente', 'tipoFiltro'],
    );

    if (!shouldRun(signature)) {
      return;
    }

    fetchClassrooms({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm,
      estado: estadoFiltro,
      asc: ordenAscendente,
      tipo: tipoFiltro,
    });
  }, [
    user?.selected_university,
    currentPage,
    searchTerm,
    estadoFiltro,
    ordenAscendente,
    tipoFiltro,
    fetchClassrooms,
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

  useEffect(() => {
    if (!drawerOpen || drawerMode === 'create') {
      return;
    }

    const id = selectedClassroom?.id;
    if (id) {
      const signature = buildRequestSignature(
        {
          resource: 'classroom-careers',
          classroomId: id,
        },
        ['resource', 'classroomId'],
      );

      if (!shouldRunClassroomCareersRequest(signature)) {
        return;
      }

      fetchClassroomCareersForClassroom(id);
    }
  }, [
    drawerOpen,
    drawerMode,
    selectedClassroom?.id,
    fetchClassroomCareersForClassroom,
    shouldRunClassroomCareersRequest,
  ]);

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Aulas"
        contextLabel={contextLabel}
        contextNotice={scheduleDraftNotice}
        actionIcon={Plus}
        actionLabel="Nueva Aula"
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
                  label="Buscar Aula"
                  placeholder="Nombre o edificio"
                  value={searchInput}
                  onChange={handleSearchChange}
                  reserveHelperSpace={false}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Filtrar por Tipo"
                  options={[
                    { value: 'todos', label: 'Todos los tipos' },
                    ...typeOptions,
                  ]}
                  value={tipoFiltro}
                  onChange={handleTipoChange}
                  showPlaceholderOption={false}
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
                  label="Ordenar"
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
            loadingMessage="Cargando aulas..."
            items={classroomsPage}
            emptyState={emptyState}
            listPanelPadding="p-0"
            getItemKey={(classroom) => classroom.id}
            renderItem={(classroom, index) => (
              <EntityListItem
                icon={Building2}
                title={classroom.name}
                subtitle={classroom.code ? `Código: ${classroom.code}` : undefined}
                metaItems={[
                  classroom.classroom_type ? `Tipo: ${classroom.classroom_type}` : null,
                ]}
                isActive={Number(classroom.status) === 1}
                onToggleStatus={() => handleOpenToggleModal(classroom)}
                onView={() => handleOpenDrawerView(classroom.id)}
                onEdit={() => handleOpenDrawerEdit(classroom.id)}
                onDelete={() => setDeleteModal({ isOpen: true, id: classroom.id, name: classroom.name })}
                showBottomBorder={index !== classroomsPage.length - 1}
                loadingAction={
                  rowActionState.classroomId === classroom.id ? rowActionState.action : null
                }
                actionsDisabled={isAnyRowActionRunning && rowActionState.classroomId !== classroom.id}
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
        title={getDrawerTitle(drawerMode, selectedClassroom)}
        size="lg"
        headerIcon={getDrawerHeaderIcon(drawerMode)}
        headerBadge={getDrawerHeaderBadge(drawerMode)}
      >
        {drawerMode === 'view' ? (
          <ClassroomDetail
            classroom={selectedClassroom}
            classroomCareers={classroomCareerLinks}
            classroomCareersLoading={classroomCareersLoading}
            onClose={handleCloseDrawer}
            onEdit={handleDrawerEditClick}
          />
        ) : (
          <ClassroomForm
            initialData={selectedClassroom}
            isLoading={classroomLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode={drawerMode}
            typeOptions={typeOptions}
            careerOptions={careerOptions}
            classroomId={selectedClassroom?.id}
            classroomCareers={classroomCareerLinks}
            classroomCareersLoading={classroomCareersLoading}
            onAddClassroomCareer={handleAddClassroomCareerToast}
            onRemoveClassroomCareer={handleRemoveClassroomCareerToast}
            onLoadSubjectPeriods={fetchClassroomSubjectPeriodsByCareer}
            onLoadSubjectOptions={fetchClassroomSubjectOptionsByCareerPeriod}
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({
          isOpen: false,
          mode: 'create',
          formData: null,
        })}
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
        title="Eliminar aula"
        message={`¿Deseas eliminar ${deleteModal.name || 'esta aula'}?`}
        confirmLabel="Eliminar"
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
