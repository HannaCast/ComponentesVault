import React, { useEffect, useRef, useState } from 'react';
import { Plus, UserCheck, Eye, Pencil } from 'lucide-react';
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
import { useTeachers } from '../hooks/useTeachers';
import { TeacherForm } from '../components/TeacherForm';
import { TeacherDetail } from '../components/TeacherDetail';

const getDrawerTitle = (mode, selectedTeacher) => {
  if (mode === 'create') return 'Nuevo profesor';
  if (mode === 'edit') return 'Editar profesor';
  return selectedTeacher?.full_name || 'Detalle';
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

const getTeacherListTitle = (teacher) => teacher.full_name || `Profesor #${teacher.id}`;

const getEmptyState = (searchTerm, estadoFiltro, onCreate) => {
  const isDefaultState = !searchTerm && estadoFiltro === 'todos';

  if (isDefaultState) {
    return {
      icon: UserCheck,
      title: 'No hay profesores registrados',
      description: 'Comienza agregando el primer profesor',
      actionIcon: Plus,
      actionLabel: 'Agregar profesor',
      onAction: onCreate,
    };
  }

  return {
    icon: UserCheck,
    title: 'No se encontraron profesores',
    description: 'Intenta con otros términos de búsqueda o filtros',
    actionIcon: undefined,
    actionLabel: undefined,
    onAction: undefined,
  };
};

const getSaveModalContent = (mode) => {
  if (mode === 'edit') {
    return {
      title: 'Confirmar guardado',
      message: '¿Deseas guardar los cambios de este profesor?',
      confirmLabel: 'Guardar',
    };
  }

  return {
    title: 'Confirmar creación',
    message: '¿Deseas crear este profesor con la información capturada?',
    confirmLabel: 'Crear',
  };
};

const getToggleModalContent = (isCurrentlyActive) => {
  if (isCurrentlyActive) {
    return {
      title: 'Desactivar profesor',
      message: 'Al desactivar, el profesor no se considerará activo en el sistema. ¿Deseas continuar?',
      confirmLabel: 'Desactivar',
    };
  }

  return {
    title: 'Activar profesor',
    message: 'El profesor volverá a marcarse como activo. ¿Deseas continuar?',
    confirmLabel: 'Activar',
  };
};

export const TeachersPage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [rowActionState, setRowActionState] = useState({ teacherId: null, action: null });
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
    teachersPage,
    totalItems,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    ordenAscendente,
    setOrdenAscendente,
    deleteModal,
    setDeleteModal,
    statusOptions,
    handleToggleStatus,
    handleDelete,
    fetchTeachers,
    selectedTeacher,
    setSelectedTeacher,
    teacherLoading,
    fetchTeacherById,
    handleCreateTeacher,
    handleUpdateTeacher,
  } = useTeachers();

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const selectedUniversity = user?.selected_university;
  const selectedUniversityId = selectedUniversity?.id;
  const contextUniversity = getSelectedUniversityDisplayName(selectedUniversity, '');
  const draftScheduleUniversityIds = user?.schedule_generation?.draft_schedule_university_ids;

  const contextLabel = contextUniversity
    ? `Contexto: ${contextUniversity}`
    : 'Registro de profesores';
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

  const isAnyRowActionRunning = rowActionState.teacherId !== null;
  const saveModalContent = getSaveModalContent(saveModal.mode);
  const toggleModalContent = getToggleModalContent(toggleModal.isCurrentlyActive);

  const runRowAction = async (teacherId, action, task) => {
    if (isAnyRowActionRunning) {
      return;
    }

    setRowActionState({ teacherId, action });

    try {
      await task();
    } finally {
      setRowActionState({ teacherId: null, action: null });
    }
  };

  async function handleOpenDrawerCreate() {
    if (isOpeningCreate) {
      return;
    }

    setIsOpeningCreate(true);

    try {
      setDrawerMode('create');
      setSelectedTeacher(null);
      setDrawerOpen(true);
    } finally {
      setIsOpeningCreate(false);
    }
  }

  const emptyState = getEmptyState(searchTerm, estadoFiltro, handleOpenDrawerCreate);

  const handleOpenDrawerView = async (id) => {
    await runRowAction(id, 'view', async () => {
      setDrawerMode('view');
      const data = await fetchTeacherById(id);
      if (data) {
        setDrawerOpen(true);
      }
    });
  };

  const handleOpenDrawerEdit = async (id) => {
    await runRowAction(id, 'edit', async () => {
      setDrawerMode('edit');
      const data = await fetchTeacherById(id);
      if (data) {
        setDrawerOpen(true);
      }
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setSelectedTeacher(null);
    setSaveModal({ isOpen: false, mode: 'create', formData: null });
  };

  const handleOpenToggleModal = (teacher) => {
    setToggleModal({
      isOpen: true,
      id: teacher.id,
      name: getTeacherListTitle(teacher),
      isCurrentlyActive: Number(teacher.status) === 1,
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
      `Profesor ${wasActive ? 'desactivado' : 'activado'} exitosamente`,
    );
  };

  const handleDrawerEditClick = async () => {
    if (selectedTeacher) {
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
        result = await handleCreateTeacher(pendingData);
      } else if (pendingMode === 'edit' && selectedTeacher?.id) {
        result = await handleUpdateTeacher(selectedTeacher.id, pendingData);
      }

      if (result?.success) {
        const action = pendingMode === 'create' ? 'creado' : 'actualizado';
        toast.success(`Profesor ${action} exitosamente`);
        if (result.softWarning) {
          toast.error(result.softWarning, { id: 'teachers-list-refresh-warning' });
        }
        handleCloseDrawer();
      } else if (result?.success === false) {
        toast.error(result.message || 'No se pudo guardar el profesor.');
      }
    } catch (err) {
      console.error('Error en formulario:', err);
    }
  };

  useEffect(() => {
    const queryParams = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm,
      estado: estadoFiltro,
      asc: ordenAscendente,
    };
    const queryKey = buildRequestSignature(queryParams, ['page', 'limit', 'search', 'estado', 'asc']);

    if (!shouldRun(queryKey)) {
      return;
    }

    fetchTeachers(queryParams);
  }, [
    currentPage,
    ITEMS_PER_PAGE,
    searchTerm,
    estadoFiltro,
    ordenAscendente,
    shouldRun,
    fetchTeachers,
  ]);

  useEffect(() => {
    if (!error) {
      return;
    }

    if (drawerOpen && drawerMode !== 'view') {
      return;
    }

    toast.error(error, { id: 'teachers-page-error' });
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
        title="Profesores"
        contextLabel={contextLabel}
        contextNotice={scheduleDraftNotice}
        actionIcon={Plus}
        actionLabel="Nuevo profesor"
        actionLoading={isOpeningCreate}
        actionLoadingLabel="Cargando..."
        actionDisabled={isOpeningCreate}
        onAction={handleOpenDrawerCreate}
      />

      <SurfacePanel>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <Input
              label="Buscar profesor"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre o apellidos"
              reserveHelperSpace={false}
            />
          </div>

          <div className="md:col-span-3">
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
          </div>

          <div className="md:col-span-3">
            <Select
              label="Orden"
              value={ordenAscendente ? 'asc' : 'desc'}
              onChange={(e) => {
                setOrdenAscendente(e.target.value === 'asc');
                setCurrentPage(1);
              }}
              options={[
                { value: 'asc', label: 'A-Z (nombre)' },
                { value: 'desc', label: 'Z-A (nombre)' },
              ]}
              showPlaceholderOption={false}
              reserveHelperSpace={false}
            />
          </div>
          
        </div>
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando profesores..."
        items={teachersPage}
        getItemKey={(teacher) => teacher.id}
        emptyState={emptyState}
        renderItem={(teacher, index) => (
          <EntityListItem
            icon={UserCheck}
            title={getTeacherListTitle(teacher)}
            metaItems={[teacher.require_classroom_display].filter(Boolean)}
            isActive={Number(teacher.status) === 1}
            activeText="Activo"
            inactiveText="Inactivo"
            onToggleStatus={() => handleOpenToggleModal(teacher)}
            onView={() => handleOpenDrawerView(teacher.id)}
            onEdit={() => handleOpenDrawerEdit(teacher.id)}
            onDelete={() => setDeleteModal({ isOpen: true, id: teacher.id })}
            showBottomBorder={index < teachersPage.length - 1}
            loadingAction={rowActionState.teacherId === teacher.id ? rowActionState.action : null}
            actionsDisabled={isAnyRowActionRunning && rowActionState.teacherId !== teacher.id}
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
        title={getDrawerTitle(drawerMode, selectedTeacher)}
        size="lg"
        headerIcon={getDrawerHeaderIcon(drawerMode)}
        headerBadge={getDrawerHeaderBadge(drawerMode)}
      >
        {drawerMode === 'view' ? (
          <TeacherDetail
            teacher={selectedTeacher}
            onClose={handleCloseDrawer}
            onEdit={handleDrawerEditClick}
          />
        ) : (
          <TeacherForm
            key={`${drawerMode}-${selectedTeacher?.id ?? 'new'}`}
            initialData={selectedTeacher}
            isLoading={teacherLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode={drawerMode}
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
        message={`${toggleModalContent.message} Profesor: ${toggleModal.name}.`}
        confirmLabel={toggleModalContent.confirmLabel}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Eliminar profesor"
        message="¿Seguro que deseas eliminar este profesor? Esta acción aplicará un borrado lógico."
        confirmLabel="Eliminar"
      />
    </div>
  );
};
