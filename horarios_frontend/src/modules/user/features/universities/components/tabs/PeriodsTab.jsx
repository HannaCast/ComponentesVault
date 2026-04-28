import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { useAcademicPeriods } from '../../hooks/useAcademicPeriods';
import { PeriodForm } from './PeriodForm';

export const PeriodsTab = ({ readOnly = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [toggleModal, setToggleModal] = useState({ isOpen: false, id: null, name: '', isCurrentlyActive: false });

  const {
    periods,
    meta,
    loading,
    fetchPeriods,
    removePeriod,
    toggleStatus,
  } = useAcademicPeriods();

  useEffect(() => {
    fetchPeriods({
      page: currentPage,
      limit: 10,
      search: searchTerm,
    });
  }, [currentPage, searchTerm, fetchPeriods]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }
    pageChangeTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setSearchTerm(value);
    }, 500);
  };

  const handleOpenDrawerCreate = () => {
    setSelectedPeriod(null);
    setDrawerOpen(true);
  };

  const handleOpenDrawerEdit = (period) => {
    setSelectedPeriod(period);
    setDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    const success = await removePeriod(deleteModal.id);
    if (success) {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleConfirmToggle = async () => {
    const success = await toggleStatus(toggleModal.id);
    if (success) {
      setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false });
    }
  };

  const emptyState = {
    icon: Calendar,
    title: searchTerm ? 'No se encontraron periodos' : 'No hay periodos',
    description: searchTerm ? 'Intenta con otra búsqueda' : 'Agrega el primer periodo',
    actionIcon: Plus,
    actionLabel: 'Nuevo Periodo',
    onAction: handleOpenDrawerCreate,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Periodos académicos</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Define los cuatrimestres, semestres o años en los que opera la universidad.
          </p>
        </div>
        <ActionButton
          type="button"
          variant="primary"
          label="Nuevo Periodo"
          icon={Plus}
          onClick={handleOpenDrawerCreate}
          disabled={loading}
          fullWidth={false}
          className={`sm:w-auto ${readOnly ? 'hidden' : ''}`}
        />
      </div>

      <SurfacePanel padding="p-4">
        <Input
          label="Buscar Periodo"
          placeholder="Nombre del periodo"
          value={searchInput}
          onChange={handleSearchChange}
          reserveHelperSpace={false}
        />
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando periodos..."
        items={periods}
        emptyState={emptyState}
        listPanelPadding="p-0"
        getItemKey={(p) => p.id}
        renderItem={(p, index) => (
          <EntityListItem
            icon={Calendar}
            title={p.name}
            metaItems={[
              `De ${String(p.start_date).slice(0, 10)} a ${String(p.end_date).slice(0, 10)}`,
              `Orden: ${p.order || 'N/A'}`,
            ]}
            isActive={Number(p.is_active) === 1}
            onToggleStatus={readOnly ? undefined : () => setToggleModal({
              isOpen: true,
              id: p.id,
              name: p.name,
              isCurrentlyActive: Number(p.is_active) === 1,
            })}
            onEdit={readOnly ? undefined : () => handleOpenDrawerEdit(p)}
            onDelete={readOnly ? undefined : () => setDeleteModal({ isOpen: true, id: p.id, name: p.name })}
            showBottomBorder={index !== periods.length - 1}
          />
        )}
        pagination={{
          currentPage,
          totalPages: Math.max(1, Math.ceil(meta.total / meta.limit)),
          totalItems: meta.total,
          itemsPerPage: meta.limit,
          onPageChange: setCurrentPage,
          hasPreviousPage: currentPage > 1,
          hasNextPage: currentPage < Math.max(1, Math.ceil(meta.total / meta.limit)),
        }}
      />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedPeriod ? 'Editar Periodo' : 'Nuevo Periodo'}
        size="md"
      >
        {drawerOpen && (
          <PeriodForm
            initialData={selectedPeriod}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Eliminar periodo"
        message={`¿Deseas eliminar el periodo "${deleteModal.name}"?`}
        confirmLabel="Eliminar"
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        title={toggleModal.isCurrentlyActive ? 'Desactivar periodo' : 'Activar periodo'}
        message={
          toggleModal.isCurrentlyActive
            ? `¿Deseas desactivar el periodo "${toggleModal.name}"?`
            : `¿Deseas marcar el periodo "${toggleModal.name}" como activo? Solo un periodo puede estar activo a la vez.`
        }
        confirmLabel={toggleModal.isCurrentlyActive ? 'Desactivar' : 'Activar'}
        onClose={() => setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false })}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
};
