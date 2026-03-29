import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { Pagination } from '@shared/components/tables/Pagination';
import { EmptyStatePanel } from '@shared/components/tables/EmptyStatePanel';
import { useSubjects } from '../hooks/useSubjects';

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  const ITEMS_PER_PAGE = 6;
  const {
    subjectsFiltered,
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
    subjects,
  } = useSubjects();

  const totalItems = subjectsFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const selectedUniversityName = user?.selected_university?.short_name
    || user?.selected_university?.name
    || user?.selected_university
    || 'Universidad seleccionada';

  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return subjectsFiltered.slice(startIndex, endIndex);
  }, [subjectsFiltered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro, ordenAscendente]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput);
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
    return (
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          backgroundColor: 'var(--warning-subtle, #fef3c7)',
          borderColor: 'var(--warning-border, #fcd34d)',
        }}
      >
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--warning, #f59e0b)' }} />
        <p className="font-medium" style={{ color: 'var(--warning-text, #92400e)' }}>
          Por favor selecciona una universidad en el apartado de Universidades
        </p>
      </div>
    );
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

      {error && (
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: 'var(--error-subtle, #fef2f2)',
            borderColor: 'var(--error-border, #fee2e2)',
          }}
        >
          <p style={{ color: 'var(--error, #dc2626)' }}>{error}</p>
        </div>
      )}

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
            onChange={(e) => setEstadoFiltro(e.target.value)}
            options={statusOptions}
            placeholder="Todas"
            reserveHelperSpace={false}
          />

          <Select
            label="Orden"
            value={ordenAscendente ? 'asc' : 'desc'}
            onChange={(e) => setOrdenAscendente(e.target.value === 'asc')}
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

      {loading ? (
        <SurfacePanel padding="p-12" centered>
          <div className="inline-block">
            <div
              className="animate-spin w-8 h-8 border-4 rounded-full"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                borderTopColor: 'var(--primary-color, #2563eb)',
              }}
            />
          </div>
          <p className="mt-4" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Cargando materias...
          </p>
        </SurfacePanel>
      ) : subjectsFiltered.length === 0 ? (
        <EmptyStatePanel
          icon={BookOpen}
          title={subjects.length === 0 ? 'No hay materias registradas' : 'No se encontraron materias'}
          description={subjects.length === 0 ? 'Comienza agregando tu primera materia' : 'Intenta con otros terminos de busqueda'}
          actionIcon={subjects.length === 0 ? Plus : undefined}
          actionLabel={subjects.length === 0 ? 'Agregar Materia' : undefined}
          onAction={subjects.length === 0 ? () => navigate('/usuario/materias/crear') : undefined}
        />
      ) : (
        <div className="space-y-4">
          <SurfacePanel padding="p-0">
            {paginatedSubjects.map((subject, index) => (
              <EntityListItem
                key={subject.id}
                icon={BookOpen}
                title={subject.name}
                metaItems={[
                  `Codigo: ${subject.code || '-'}`,
                  subject.credits ? `${subject.credits} creditos` : null,
                ]}
                isActive={subject.is_active}
                activeText="Activa"
                inactiveText="Inactiva"
                onToggleStatus={() => handleToggleStatus(subject.id, subject.is_active)}
                onDelete={() => setDeleteModal({ isOpen: true, id: subject.id })}
                onContentClick={() => navigate(`/usuario/materias/editar/${subject.id}`)}
                showBottomBorder={index < paginatedSubjects.length - 1}
              />
            ))}
          </SurfacePanel>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      )}

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
