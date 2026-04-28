import React, { useEffect, useRef, useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { EntityListItem } from '@shared/components/tables/EntityListItem';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { useModalities } from '../../hooks/useModalities';
import { ModalityForm } from './ModalityForm';

export const ModalitiesTab = ({ readOnly = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' for all, 'true' for active
  const pageChangeTimeoutRef = useRef(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedModality, setSelectedModality] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [toggleModal, setToggleModal] = useState({ isOpen: false, id: null, name: '', isCurrentlyActive: false });

  const {
    modalities,
    meta,
    loading,
    fetchModalities,
    removeModality,
    toggleStatus,
  } = useModalities();

  useEffect(() => {
    fetchModalities({
      page: currentPage,
      limit: 10,
      search: searchTerm,
      status: statusFilter !== '' ? statusFilter : undefined,
    });
  }, [currentPage, searchTerm, statusFilter, fetchModalities]);

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
    setSelectedModality(null);
    setDrawerOpen(true);
  };

  const handleOpenDrawerEdit = (modality) => {
    setSelectedModality(modality);
    setDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    const success = await removeModality(deleteModal.id);
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
    icon: Settings,
    title: searchTerm ? 'No se encontraron modalidades' : 'No hay modalidades',
    description: searchTerm ? 'Intenta con otra búsqueda' : 'Agrega la primera modalidad',
    actionIcon: Plus,
    actionLabel: 'Nueva Modalidad',
    onAction: handleOpenDrawerCreate,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Modalidades</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gestiona las modalidades de estudio (Presencial, En línea, etc.)
          </p>
        </div>
        <ActionButton
          type="button"
          variant="primary"
          label="Nueva Modalidad"
          icon={Plus}
          onClick={handleOpenDrawerCreate}
          disabled={loading}
          fullWidth={false}
          className={`sm:w-auto ${readOnly ? 'hidden' : ''}`}
        />
      </div>

      <SurfacePanel padding="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <Input
              label="Buscar Modalidad"
              placeholder="Nombre de la modalidad"
              value={searchInput}
              onChange={handleSearchChange}
              reserveHelperSpace={false}
            />
          </div>
          <div className="md:col-span-4">
            <Select
              label="Estado"
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Activos' },
                { value: 'false', label: 'Inactivos' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              showPlaceholderOption={false}
              reserveHelperSpace={false}
            />
          </div>
        </div>
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando modalidades..."
        items={modalities}
        emptyState={emptyState}
        listPanelPadding="p-0"
        getItemKey={(m) => m.id}
        renderItem={(m, index) => (
          <EntityListItem
            icon={Settings}
            title={m.name}
            metaItems={[
              `Días requeridos: ${m.configurations?.classroom_days_per_week ?? 0}`,
              `Días permitidos: ${(m.configurations?.allowed_days || []).length}`,
            ]}
            isActive={Number(m.status) === 1}
            onToggleStatus={readOnly ? undefined : () => setToggleModal({
              isOpen: true,
              id: m.id,
              name: m.name,
              isCurrentlyActive: Number(m.status) === 1,
            })}
            onEdit={readOnly ? undefined : () => handleOpenDrawerEdit(m)}
            onDelete={readOnly ? undefined : () => setDeleteModal({ isOpen: true, id: m.id, name: m.name })}
            showBottomBorder={index !== modalities.length - 1}
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
        title={selectedModality ? 'Editar Modalidad' : 'Nueva Modalidad'}
        size="md"
      >
        {drawerOpen && (
          <ModalityForm
            initialData={selectedModality}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Eliminar modalidad"
        message={`¿Deseas eliminar la modalidad "${deleteModal.name}"?`}
        confirmLabel="Eliminar"
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        title={toggleModal.isCurrentlyActive ? 'Desactivar modalidad' : 'Activar modalidad'}
        message={`¿Deseas ${toggleModal.isCurrentlyActive ? 'desactivar' : 'activar'} la modalidad "${toggleModal.name}"?`}
        confirmLabel={toggleModal.isCurrentlyActive ? 'Desactivar' : 'Activar'}
        onClose={() => setToggleModal({ isOpen: false, id: null, name: '', isCurrentlyActive: false })}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
};
