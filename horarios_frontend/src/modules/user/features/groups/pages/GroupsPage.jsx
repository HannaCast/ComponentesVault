import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Pencil, Plus, Users } from 'lucide-react';
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
import { GroupDetail } from '../components/GroupDetail';
import { GroupForm } from '../components/GroupForm';
import { useGroups } from '../hooks/useGroups';

const orderOptions = [
  { value: 'asc', label: 'A-Z' },
  { value: 'desc', label: 'Z-A' },
];

const getDrawerTitle = (mode, selectedGroup) => {
  if (mode === 'create') return 'Crear Nuevo Grupo';
  if (mode === 'edit') return 'Editar Grupo';
  return selectedGroup?.name || 'Detalle';
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
      title: 'Confirmar Guardado',
      message: '¿Deseas guardar los cambios de este grupo?',
      confirmLabel: 'Guardar',
    };
  }

  return {
    title: 'Confirmar Creación',
    message: '¿Deseas crear este grupo con la información capturada?',
    confirmLabel: 'Crear',
  };
};

const getEmptyState = (searchTerm, estadoFiltro, careerFiltro, onCreate) => {
  const isDefaultState = !searchTerm && estadoFiltro === 'todos' && careerFiltro === 'todas';

  if (isDefaultState) {
    return {
      icon: Users,
      title: 'No hay grupos registrados',
      description: 'Comienza agregando tu primer grupo',
      actionIcon: Plus,
      actionLabel: 'Agregar Grupo',
      onAction: onCreate,
    };
  }

  return {
    icon: Users,
    title: 'No se encontraron grupos',
    description: 'Intenta con otros terminos de busqueda o filtros',
    actionIcon: undefined,
    actionLabel: undefined,
    onAction: undefined,
  };
};

const getToggleModalContent = (isCurrentlyActive) => {
  if (isCurrentlyActive) {
    return {
      title: 'Desactivar Grupo',
      message: 'Al desactivar este grupo no se tomará en cuenta para la generación de horarios. ¿Deseas continuar?',
      confirmLabel: 'Desactivar',
    };
  }

  return {
    title: 'Activar Grupo',
    message: 'Este grupo volverá a considerarse para la generación de horarios. ¿Deseas continuar?',
    confirmLabel: 'Activar',
  };
};

export const GroupsPage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunCatalogRequest } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunFilterCareerRequest } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [rowActionState, setRowActionState] = useState({ groupId: null, action: null });
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
    groupsPage,
    totalItems,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    ordenAscendente,
    setOrdenAscendente,
    careerFiltro,
    setCareerFiltro,
    deleteModal,
    setDeleteModal,
    statusOptions,
    careerOptions,
    shiftOptions,
    fetchCareerOptions,
    fetchShiftOptions,
    fetchGroups,
    handleToggleStatus,
    handleDelete,
    selectedGroup,
    setSelectedGroup,
    groupLoading,
    fetchGroupById,
    handleCreateGroup,
    handleUpdateGroup,
  } = useGroups();

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const selectedUniversity = user?.selected_university;
  const selectedUniversityId = selectedUniversity?.id;
  const selectedUniversityName = getSelectedUniversityDisplayName(
    selectedUniversity,
    'Universidad seleccionada',
  );
  const activeAcademicPeriodName = String(
    user?.selected_university_active_period_name || '',
  ).trim();
  const contextLabel = activeAcademicPeriodName
    ? `Grupos de: ${selectedUniversityName} | Periodo: ${activeAcademicPeriodName}`
    : `Grupos de: ${selectedUniversityName}`;
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

  const isAnyRowActionRunning = rowActionState.groupId !== null;
  const saveModalContent = getSaveModalContent(saveModal.mode);
  const toggleModalContent = getToggleModalContent(toggleModal.isCurrentlyActive);
  const emptyState = getEmptyState(searchTerm, estadoFiltro, careerFiltro, handleOpenDrawerCreate);

  const runRowAction = async (groupId, action, task) => {
    if (isAnyRowActionRunning) {
      return;
    }

    setRowActionState({ groupId, action });

    try {
      await task();
    } finally {
      setRowActionState({ groupId: null, action: null });
    }
  };

  const loadCatalogsForModal = async (modalMode) => {
    const catalogsSignature = buildRequestSignature(
      {
        resource: 'groups-catalogs',
        selectedUniversityId,
        mode: modalMode,
      },
      ['resource', 'selectedUniversityId', 'mode'],
    );

    if (!shouldRunCatalogRequest(catalogsSignature)) {
      return;
    }

    await Promise.all([fetchCareerOptions(), fetchShiftOptions()]);
  };

  const loadFilterCareerOptions = useCallback(async () => {
    const signature = buildRequestSignature(
      {
        resource: 'groups-career-filter-options',
        selectedUniversityId,
      },
      ['resource', 'selectedUniversityId'],
    );

    if (!shouldRunFilterCareerRequest(signature)) {
      return;
    }

    await fetchCareerOptions();
  }, [
    selectedUniversityId,
    shouldRunFilterCareerRequest,
    fetchCareerOptions,
  ]);

  async function handleOpenDrawerCreate() {
    if (isOpeningCreate) {
      return;
    }

    setIsOpeningCreate(true);

    try {
      await loadCatalogsForModal('create');
      setDrawerMode('create');
      setSelectedGroup(null);
      setDrawerOpen(true);
    } finally {
      setIsOpeningCreate(false);
    }
  }

  const handleOpenDrawerView = async (id) => {
    await runRowAction(id, 'view', async () => {
      setDrawerMode('view');
      const groupData = await fetchGroupById(id);
      if (groupData) {
        setDrawerOpen(true);
      }
    });
  };

  const handleOpenDrawerEdit = async (id) => {
    await runRowAction(id, 'edit', async () => {
      setDrawerMode('edit');
      await loadCatalogsForModal('edit');
      const groupData = await fetchGroupById(id);
      if (groupData) {
        setDrawerOpen(true);
      }
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setSelectedGroup(null);
    setSaveModal({ isOpen: false, mode: 'create', formData: null });
  };

  const handleOpenToggleModal = (group) => {
    setToggleModal({
      isOpen: true,
      id: group.id,
      name: group.name || 'el grupo',
      isCurrentlyActive: Number(group.status) === 1,
    });
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleModal.id) {
      return;
    }

    const wasActive = toggleModal.isCurrentlyActive;

    await runRowAction(toggleModal.id, 'toggle', async () => {
      await handleToggleStatus(toggleModal.id);
    });

    toast.success(
      `Grupo ${wasActive ? 'desactivado' : 'activado'} exitosamente`,
    );
  };

  const handleDrawerEditClick = async () => {
    if (selectedGroup) {
      await loadCatalogsForModal('edit');
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
      let result;
      if (pendingMode === 'create') {
        result = await handleCreateGroup(pendingData);
      } else if (pendingMode === 'edit' && selectedGroup?.id) {
        result = await handleUpdateGroup(selectedGroup.id, pendingData);
      }

      if (result) {
        const action = pendingMode === 'create' ? 'creado' : 'actualizado';
        toast.success(`Grupo ${action} exitosamente`);
        handleCloseDrawer();
      }
    } catch (err) {
      console.error('Error en formulario:', err);
    }
  };

  /** Carreras para el filtro del listado (el formulario reutiliza el mismo catálogo vía loadCatalogsForModal + dedupe). */
  useEffect(() => {
    if (!user?.selected_university) {
      return;
    }
    loadFilterCareerOptions();
  }, [user?.selected_university, loadFilterCareerOptions]);

  useEffect(() => {
    const queryParams = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm,
      estado: estadoFiltro,
      asc: ordenAscendente,
      careerId: careerFiltro,
    };
    const queryKey = buildRequestSignature(
      queryParams,
      ['page', 'limit', 'search', 'estado', 'asc', 'careerId'],
    );

    if (!shouldRun(queryKey)) {
      return;
    }

    fetchGroups(queryParams);
  }, [
    currentPage,
    ITEMS_PER_PAGE,
    searchTerm,
    estadoFiltro,
    ordenAscendente,
    careerFiltro,
    shouldRun,
    fetchGroups,
  ]);

  useEffect(() => {
    if (!error) {
      return;
    }

    if (drawerOpen && drawerMode !== 'view') {
      return;
    }

    toast.error(error, { id: 'groups-page-error' });
  }, [error, drawerOpen, drawerMode]);

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

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }

    pageChangeTimeoutRef.current = setTimeout(() => {
      setCurrentPage(safePage);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Grupos"
        contextLabel={contextLabel}
        contextNotice={scheduleDraftNotice}
        actionIcon={Plus}
        actionLabel="Nuevo Grupo"
        actionLoading={isOpeningCreate}
        actionLoadingLabel="Cargando..."
        actionDisabled={isOpeningCreate}
        onAction={handleOpenDrawerCreate}
      />

      <SurfacePanel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Buscar Grupo"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nombre del grupo"
            reserveHelperSpace={false}
          />

          <Select
            label="Carrera"
            value={careerFiltro}
            onChange={(e) => {
              setCareerFiltro(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'todas', label: 'Todas las carreras' },
              ...careerOptions,
            ]}
            placeholder="Todas"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />

          <Select
            label="Estado"
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setCurrentPage(1);
            }}
            options={statusOptions}
            placeholder="Todos"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />

          <Select
            label="Orden"
            value={ordenAscendente ? 'asc' : 'desc'}
            onChange={(e) => {
              setOrdenAscendente(e.target.value === 'asc');
              setCurrentPage(1);
            }}
            options={orderOptions}
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />
        </div>
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando grupos..."
        items={groupsPage}
        getItemKey={(group) => group.id}
        emptyState={emptyState}
        renderItem={(group, index) => (
          <EntityListItem
            icon={Users}
            title={group.name}
            subtitle={group.career_name ? `Carrera: ${group.career_name}` : undefined}
            metaItems={[
              group.period_number == null ? null : `Periodo: ${group.period_number}`,
              group.letter ? `Letra: ${group.letter}` : null,
              group.shift_name ? `Turno: ${group.shift_name}` : null,
            ]}
            isActive={Number(group.status) === 1}
            activeText="Activo"
            inactiveText="Inactivo"
            onToggleStatus={() => handleOpenToggleModal(group)}
            onView={() => handleOpenDrawerView(group.id)}
            onEdit={() => handleOpenDrawerEdit(group.id)}
            onDelete={() => setDeleteModal({ isOpen: true, id: group.id })}
            showBottomBorder={index < groupsPage.length - 1}
            loadingAction={
              rowActionState.groupId === group.id ? rowActionState.action : null
            }
            actionsDisabled={isAnyRowActionRunning && rowActionState.groupId !== group.id}
          />
        )}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: ITEMS_PER_PAGE,
          onPageChange: handlePageChange,
        }}
      />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={getDrawerTitle(drawerMode, selectedGroup)}
        size="lg"
        headerIcon={getDrawerHeaderIcon(drawerMode)}
        headerBadge={getDrawerHeaderBadge(drawerMode)}
      >
        {drawerMode === 'view' ? (
          <GroupDetail
            group={selectedGroup}
            onClose={handleCloseDrawer}
            onEdit={handleDrawerEditClick}
          />
        ) : (
          <GroupForm
            initialData={selectedGroup}
            isLoading={groupLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode={drawerMode}
            careerOptions={careerOptions}
            shiftOptions={shiftOptions}
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
        closeOnConfirm={true}
      />

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        onClose={() => setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false })}
        onConfirm={handleConfirmToggleStatus}
        title={toggleModalContent.title}
        message={toggleModalContent.message}
        confirmLabel={toggleModalContent.confirmLabel}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Eliminar Grupo"
        message="Esta seguro que desea eliminar este grupo? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
};
