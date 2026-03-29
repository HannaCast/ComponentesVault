import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { SelectedUniversityAlert } from '@shared/components/layout/SelectedUniversityAlert';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { useSubjects } from '../hooks/useSubjects';

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;
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
  } = useSubjects();

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const selectedUniversityName = user?.selected_university?.short_name
    || user?.selected_university?.name
    || user?.selected_university
    || 'Universidad seleccionada';

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

    toast.error(error, { id: 'subjects-page-error' });
  }, [error]);

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
        onAction={() => navigate('/usuario/materias/crear')}
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
          onAction: !searchTerm && estadoFiltro === 'todos' ? () => navigate('/usuario/materias/crear') : undefined,
        }}
        renderItem={(subject, index) => (
          <EntityListItem
            icon={BookOpen}
            title={subject.name}
            metaItems={[
              `Codigo: ${subject.code || '-'}`,
              subject.credits ? `${subject.credits} creditos` : null,
            ]}
            isActive={subject.is_active}
            activeText="Activa"
            inactiveText="Inactiva"
            onToggleStatus={() => handleToggleStatus(subject.id, Boolean(subject.is_active))}
            onDelete={() => setDeleteModal({ isOpen: true, id: subject.id })}
            onContentClick={() => navigate(`/usuario/materias/editar/${subject.id}`)}
            showBottomBorder={index < subjectsPage.length - 1}
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

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Eliminar Materia"
        message="Esta seguro que desea eliminar esta materia? Esta accion no se puede deshacer."
      />
    </div>
  );
};
