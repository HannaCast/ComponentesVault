import React, { useEffect, useRef, useState } from 'react';
import { Plus, BookOpen, Eye, Pencil } from 'lucide-react';
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
import { useSubjects } from '../hooks/useSubjects';
import { SubjectForm } from '../components/SubjectForm';
import { SubjectDetail } from '../components/SubjectDetail';

const getDrawerTitle = (mode, selectedSubject) => {
  if (mode === 'create') return 'Crear Nueva Materia';
  if (mode === 'edit') return 'Editar Materia';
  return selectedSubject?.name || 'Detalle';
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

const getSubjectTitle = (subject) => {
  if (subject.short_name) {
    return `${subject.name} (${subject.short_name})`;
  }

  return subject.name;
};

const getEmptyState = (searchTerm, estadoFiltro, onCreate) => {
  const isDefaultState = !searchTerm && estadoFiltro === 'todos';

  if (isDefaultState) {
    return {
      icon: BookOpen,
      title: 'No hay materias registradas',
      description: 'Comienza agregando tu primera materia',
      actionIcon: Plus,
      actionLabel: 'Agregar Materia',
      onAction: onCreate,
    };
  }

  return {
    icon: BookOpen,
    title: 'No se encontraron materias',
    description: 'Intenta con otros terminos de busqueda',
    actionIcon: undefined,
    actionLabel: undefined,
    onAction: undefined,
  };
};

const getSaveModalContent = (mode) => {
  if (mode === 'edit') {
    return {
      title: 'Confirmar Guardado',
      message: '¿Deseas guardar los cambios de esta materia?',
      confirmLabel: 'Guardar',
    };
  }

  return {
    title: 'Confirmar Creación',
    message: '¿Deseas crear esta materia con la información capturada?',
    confirmLabel: 'Crear',
  };
};

const getToggleModalContent = (isCurrentlyActive) => {
  if (isCurrentlyActive) {
    return {
      title: 'Desactivar Materia',
      message: 'Al desactivar esta materia no se tomará en cuenta para la generación de horarios. ¿Deseas continuar?',
      confirmLabel: 'Desactivar',
    };
  }

  return {
    title: 'Activar Materia',
    message: 'Esta materia volverá a considerarse para la generación de horarios. ¿Deseas continuar?',
    confirmLabel: 'Activar',
  };
};

export const SubjectsPage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunColorRequest } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create'); // 'create', 'edit', 'view'
  const [rowActionState, setRowActionState] = useState({ subjectId: null, action: null });
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
    subjectsPage,
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
    fetchSubjects,
    selectedSubject,
    setSelectedSubject,
    subjectLoading,
    fetchSubjectById,
    handleCreateSubject,
    handleUpdateSubject,
    colorOptions,
    fetchColorOptions,
    careerOptions,
    fetchCareerOptions,
    professorOptions,
    fetchProfessorOptions,
    classroomTypeOptions,
    fetchClassroomTypeOptions,
  } = useSubjects();

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const selectedUniversity = user?.selected_university;
  const selectedUniversityId = selectedUniversity?.id;
  const selectedUniversityName = getSelectedUniversityDisplayName(
    selectedUniversity,
    'Universidad seleccionada',
  );
  const contextLabel = `Materias de: ${selectedUniversityName}`;
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

  const isAnyRowActionRunning = rowActionState.subjectId !== null;
  const saveModalContent = getSaveModalContent(saveModal.mode);
  const toggleModalContent = getToggleModalContent(toggleModal.isCurrentlyActive);
  const emptyState = getEmptyState(searchTerm, estadoFiltro, handleOpenDrawerCreate);

  const runRowAction = async (subjectId, action, task) => {
    if (isAnyRowActionRunning) {
      return;
    }

    setRowActionState({ subjectId, action });

    try {
      await task();
    } finally {
      setRowActionState({ subjectId: null, action: null });
    }
  };

  async function handleOpenDrawerCreate() {
    if (isOpeningCreate) {
      return;
    }

    setIsOpeningCreate(true);

    try {
      await loadCatalogsForModal('create');
      setDrawerMode('create');
      setSelectedSubject(null);
      setDrawerOpen(true);
    } finally {
      setIsOpeningCreate(false);
    }
  }

  const loadCatalogsForModal = async (modalMode) => {
    const catalogsSignature = buildRequestSignature(
      { resource: 'subjects-catalogs', mode: modalMode },
      ['resource', 'mode']
    );

    if (!shouldRunColorRequest(catalogsSignature)) {
      return;
    }

    await Promise.all([
      fetchColorOptions(),
      fetchCareerOptions(),
      fetchProfessorOptions(),
      fetchClassroomTypeOptions(),
    ]);
  };

  const handleOpenDrawerView = async (id) => {
    await runRowAction(id, 'view', async () => {
      setDrawerMode('view');
      const subjectData = await fetchSubjectById(id);
      if (subjectData) {
        setDrawerOpen(true);
      }
    });
  };

  const handleOpenDrawerEdit = async (id) => {
    await runRowAction(id, 'edit', async () => {
      setDrawerMode('edit');
      await loadCatalogsForModal('edit');
      const subjectData = await fetchSubjectById(id);
      if (subjectData) {
        setDrawerOpen(true);
      }
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setSelectedSubject(null);
    setSaveModal({ isOpen: false, mode: 'create', formData: null });
  };

  const handleOpenToggleModal = (subject) => {
    setToggleModal({
      isOpen: true,
      id: subject.id,
      name: subject.name || 'la materia',
      isCurrentlyActive: Number(subject.status) === 1,
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
      `Materia ${wasActive ? 'desactivada' : 'activada'} exitosamente`
    );
  };

  const handleDrawerEditClick = async () => {
    if (selectedSubject) {
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
        result = await handleCreateSubject(pendingData);
      } else if (pendingMode === 'edit' && selectedSubject?.id) {
        result = await handleUpdateSubject(selectedSubject.id, pendingData);
      }

      if (result) {
        const action = pendingMode === 'create' ? 'creada' : 'actualizada';
        toast.success(`Materia ${action} exitosamente`);
        handleCloseDrawer();
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

    fetchSubjects(queryParams);
  }, [
    currentPage,
    ITEMS_PER_PAGE,
    searchTerm,
    estadoFiltro,
    ordenAscendente,
    shouldRun,
    fetchSubjects,
  ]);

  useEffect(() => {
    if (!error) {
      return;
    }

    if (drawerOpen && drawerMode !== 'view') {
      return;
    }

    toast.error(error, { id: 'subjects-page-error' });
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
        title="Materias"
        contextLabel={contextLabel}
        contextNotice={scheduleDraftNotice}
        actionIcon={Plus}
        actionLabel="Nueva Materia"
        actionLoading={isOpeningCreate}
        actionLoadingLabel="Cargando..."
        actionDisabled={isOpeningCreate}
        onAction={handleOpenDrawerCreate}
      />

      <SurfacePanel>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <Input
              label="Buscar Materia"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre o codigo"
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
              placeholder="Todas"
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
                { value: 'asc', label: 'A-Z' },
                { value: 'desc', label: 'Z-A' },
              ]}
              showPlaceholderOption={false}
              reserveHelperSpace={false}
            />
          </div>
          
        </div>
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando materias..."
        items={subjectsPage}
        getItemKey={(subject) => subject.id}
        emptyState={emptyState}
        renderItem={(subject, index) => (
          <EntityListItem
            icon={BookOpen}
            title={getSubjectTitle(subject)}
            metaItems={[
              `Codigo: ${subject.code || '-'}`,
              subject.credits ? `${subject.credits} creditos` : null,
            ]}
            isActive={Number(subject.status) === 1}
            activeText="Activa"
            inactiveText="Inactiva"
            onToggleStatus={() => handleOpenToggleModal(subject)}
            onView={() => handleOpenDrawerView(subject.id)}
            onEdit={() => handleOpenDrawerEdit(subject.id)}
            onDelete={() => setDeleteModal({ isOpen: true, id: subject.id })}
            showBottomBorder={index < subjectsPage.length - 1}
            loadingAction={rowActionState.subjectId === subject.id ? rowActionState.action : null}
            actionsDisabled={isAnyRowActionRunning && rowActionState.subjectId !== subject.id}
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
        title={getDrawerTitle(drawerMode, selectedSubject)}
        size="lg"
        headerIcon={getDrawerHeaderIcon(drawerMode)}
        headerBadge={getDrawerHeaderBadge(drawerMode)}
      >
        {drawerMode === 'view' ? (
          <SubjectDetail
            subject={selectedSubject}
            onClose={handleCloseDrawer}
            onEdit={handleDrawerEditClick}
          />
        ) : (
          <SubjectForm
            initialData={selectedSubject}
            isLoading={subjectLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode={drawerMode}
            colorOptions={colorOptions}
            careerOptions={careerOptions}
            professorOptions={professorOptions}
            classroomTypeOptions={classroomTypeOptions}
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
        title="Eliminar Materia"
        message="Esta seguro que desea eliminar esta materia? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
};
