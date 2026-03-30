import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Eye, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { SelectedUniversityAlert } from '@shared/components/layout/SelectedUniversityAlert';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { useSubjects } from '../hooks/useSubjects';
import { SubjectForm } from '../components/SubjectForm';
import { SubjectDetail } from '../components/SubjectDetail';

export const SubjectsPage = () => {
  const navigate = useNavigate();
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
  const [drawerSubject, setDrawerSubject] = useState(null);
  const [rowActionState, setRowActionState] = useState({ subjectId: null, action: null });
  const [isOpeningCreate, setIsOpeningCreate] = useState(false);
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
  } = useSubjects();

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const selectedUniversityName = user?.selected_university?.short_name
    || user?.selected_university?.name
    || user?.selected_university
    || 'Universidad seleccionada';

  const isAnyRowActionRunning = rowActionState.subjectId !== null;

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

  const handleOpenDrawerCreate = async () => {
    if (isOpeningCreate) {
      return;
    }

    setIsOpeningCreate(true);

    try {
      await loadCatalogsForModal('create');
      setDrawerMode('create');
      setDrawerSubject(null);
      setSelectedSubject(null);
      setDrawerOpen(true);
    } finally {
      setIsOpeningCreate(false);
    }
  };

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
    setDrawerSubject(null);
    setSelectedSubject(null);
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

  const handleFormSubmit = async (formData) => {
    try {
      let result;
      if (drawerMode === 'create') {
        result = await handleCreateSubject(formData);
      } else if (drawerMode === 'edit') {
        result = await handleUpdateSubject(selectedSubject.id, formData);
      }

      if (result) {
        const action = drawerMode === 'create' ? 'creada' : 'actualizada';
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

  if (!user?.selected_university) {
    return <SelectedUniversityAlert />;
  }

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Materias"
        contextLabel={`Materias de: ${selectedUniversityName}`}
        actionIcon={Plus}
        actionLabel="Nueva Materia"
        actionLoading={isOpeningCreate}
        actionLoadingLabel="Cargando..."
        actionDisabled={isOpeningCreate}
        onAction={handleOpenDrawerCreate}
      />

      <SurfacePanel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar Materia"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nombre o codigo"
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
            placeholder="Todas"
            reserveHelperSpace={false}
          />

          <Select
            label="Orden"
            value={ordenAscendente ? 'asc' : 'desc'}
            onChange={(e) => {
              setOrdenAscendente(e.target.value === 'asc');
              setCurrentPage(1);
            }}
            options={[
              { value: 'asc', label: 'Ascendente' },
              { value: 'desc', label: 'Descendente' },
            ]}
            placeholder="Ascendente"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />
        </div>
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando materias..."
        items={subjectsPage}
        getItemKey={(subject) => subject.id}
        emptyState={{
          icon: BookOpen,
          title: !searchTerm && estadoFiltro === 'todos' ? 'No hay materias registradas' : 'No se encontraron materias',
          description: !searchTerm && estadoFiltro === 'todos' ? 'Comienza agregando tu primera materia' : 'Intenta con otros terminos de busqueda',
          actionIcon: !searchTerm && estadoFiltro === 'todos' ? Plus : undefined,
          actionLabel: !searchTerm && estadoFiltro === 'todos' ? 'Agregar Materia' : undefined,
          onAction: !searchTerm && estadoFiltro === 'todos' ? handleOpenDrawerCreate : undefined,
        }}
        renderItem={(subject, index) => (
          <EntityListItem
            icon={BookOpen}
            title={subject.name}
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
        title={
          drawerMode === 'create'
            ? 'Crear Nueva Materia'
            : drawerMode === 'edit'
              ? 'Editar Materia'
              : `${selectedSubject?.name || 'Detalle'}`
        }
        size="lg"
        headerIcon={drawerMode === 'create' ? Plus : drawerMode === 'edit' ? Pencil : Eye}
        headerBadge={drawerMode === 'create' ? 'Crear' : drawerMode === 'edit' ? 'Editar' : 'Ver'}
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
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        onClose={() => setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false })}
        onConfirm={handleConfirmToggleStatus}
        title={toggleModal.isCurrentlyActive ? 'Desactivar Materia' : 'Activar Materia'}
        message={toggleModal.isCurrentlyActive
          ? 'Al desactivar esta materia no se tomará en cuenta para la generación de horarios. ¿Deseas continuar?'
          : 'Esta materia volverá a considerarse para la generación de horarios. ¿Deseas continuar?'}
        confirmLabel={toggleModal.isCurrentlyActive ? 'Desactivar' : 'Activar'}
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
