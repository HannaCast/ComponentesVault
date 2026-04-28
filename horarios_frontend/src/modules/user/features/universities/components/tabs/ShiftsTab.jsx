import React, { useEffect, useRef, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { useShifts } from '../../hooks/useShifts';
import { ShiftForm } from './ShiftForm';

export const ShiftsTab = ({ readOnly = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const pageChangeTimeoutRef = useRef(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const {
    shifts,
    meta,
    loading,
    fetchShifts,
    removeShift,
  } = useShifts();

  useEffect(() => {
    fetchShifts({
      page: currentPage,
      limit: 10,
      search: searchTerm,
    });
  }, [currentPage, searchTerm, fetchShifts]);

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
    setSelectedShift(null);
    setDrawerOpen(true);
  };

  const handleOpenDrawerEdit = (shift) => {
    setSelectedShift(shift);
    setDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    const success = await removeShift(deleteModal.id);
    if (success) {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const emptyState = {
    icon: Clock,
    title: searchTerm ? 'No se encontraron turnos' : 'No hay turnos',
    description: searchTerm ? 'Intenta con otra búsqueda' : 'Agrega el primer turno',
    actionIcon: Plus,
    actionLabel: 'Nuevo Turno',
    onAction: handleOpenDrawerCreate,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Turnos</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configura los turnos de la universidad (Matutino, Vespertino, etc.)
          </p>
        </div>
        <ActionButton
          type="button"
          variant="primary"
          label="Nuevo Turno"
          icon={Plus}
          onClick={handleOpenDrawerCreate}
          disabled={loading}
          fullWidth={false}
          className={`sm:w-auto ${readOnly ? 'hidden' : ''}`}
        />
      </div>

      <SurfacePanel padding="p-4">
        <Input
          label="Buscar Turno"
          placeholder="Nombre del turno"
          value={searchInput}
          onChange={handleSearchChange}
          reserveHelperSpace={false}
        />
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando turnos..."
        items={shifts}
        emptyState={emptyState}
        listPanelPadding="p-0"
        getItemKey={(s) => s.id}
        renderItem={(s, index) => (
          <EntityListItem
            icon={Clock}
            title={s.name}
            metaItems={[
              `De ${String(s.start_time).slice(0, 5)} a ${String(s.end_time).slice(0, 5)}`,
            ]}
            isActive={Number(s.status) === 1}
            onEdit={readOnly ? undefined : () => handleOpenDrawerEdit(s)}
            onDelete={readOnly ? undefined : () => setDeleteModal({ isOpen: true, id: s.id, name: s.name })}
            showBottomBorder={index !== shifts.length - 1}
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
        title={selectedShift ? 'Editar Turno' : 'Nuevo Turno'}
        size="md"
      >
        {drawerOpen && (
          <ShiftForm
            initialData={selectedShift}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Eliminar turno"
        message={`¿Deseas eliminar el turno "${deleteModal.name}"?`}
        confirmLabel="Eliminar"
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
