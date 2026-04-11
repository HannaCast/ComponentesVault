import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Plus, School } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@context/AuthContext';
import { putSelectedUniversity } from '../api/universitiesApi';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { EmptyStatePanel } from '@shared/components/tables/EmptyStatePanel';
import { Pagination } from '@shared/components/tables/Pagination';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { UniversityDetail } from '../components/UniversityDetail';
import { UniversityForm } from '../components/UniversityForm';
import { useUniversities } from '../hooks/useUniversities';

const orderOptions = [
  { value: 'asc', label: 'A-Z' },
  { value: 'desc', label: 'Z-A' },
];

const formatTime = (value) => {
  if (value == null || value === '') {
    return '—';
  }
  const s = String(value);
  if (s.length >= 5) {
    return s.slice(0, 5);
  }
  return s;
};

const getEmptyState = (searchTerm, onCreate) => {
  const isDefault = !searchTerm;

  if (isDefault) {
    return {
      icon: School,
      title: 'No hay universidades registradas',
      description: 'Comienza agregando tu primera universidad',
      actionIcon: Plus,
      actionLabel: 'Agregar Universidad',
      onAction: onCreate,
    };
  }

  return {
    icon: School,
    title: 'No se encontraron universidades',
    description: 'Intenta con otros términos de búsqueda',
    actionIcon: undefined,
    actionLabel: undefined,
    onAction: undefined,
  };
};

const parseApiError = (err, fallback) => {
  const d = err?.response?.data;
  if (typeof d?.message === 'string' && d.message.trim()) {
    return d.message;
  }
  if (d?.data != null && typeof d.data !== 'object') {
    return String(d.data);
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  return fallback;
};

export const UniversitiesPage = () => {
  const { user, restoreSession } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [selectingId, setSelectingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageChangeTimeoutRef = useRef(null);
  const ITEMS_PER_PAGE = 6;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [isOpeningCreate, setIsOpeningCreate] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [editFormKey, setEditFormKey] = useState(0);
  const [saveModal, setSaveModal] = useState({
    isOpen: false,
    payload: null,
    logoFile: null,
    saveKind: 'create',
    universityId: null,
  });

  const { shouldRun: shouldRunCatalog } = useRequestDeduper({ windowMs: 300 });

  const {
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    ordenAscendente,
    setOrdenAscendente,
    fetchUniversities,
    filteredUniversities,
    periodTypeOptions,
    fetchPeriodTypes,
    createUniversityFullSetup,
    updateUniversityFullSetup,
    createLoading,
    updateLoading,
    universityProfile,
    profileLoading,
    fetchUniversityProfile,
    clearUniversityProfile,
  } = useUniversities();

  const totalItems = filteredUniversities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const pagedUniversities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUniversities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUniversities, currentPage, ITEMS_PER_PAGE]);

  const handleOpenCreate = async () => {
    if (isOpeningCreate) {
      return;
    }
    setIsOpeningCreate(true);
    try {
      const sig = buildRequestSignature({ resource: 'period-types' }, ['resource']);
      if (shouldRunCatalog(sig)) {
        await fetchPeriodTypes();
      }
      setFormResetKey((k) => k + 1);
      setDrawerMode('create');
      clearUniversityProfile();
      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar los tipos de periodo. Intenta de nuevo.');
    } finally {
      setIsOpeningCreate(false);
    }
  };

  const emptyState = getEmptyState(searchTerm, handleOpenCreate);

  const handleOrderChange = (event) => {
    const value = event?.target?.value;
    setOrdenAscendente(value === 'asc');
    setCurrentPage(1);
  };

  const handleOpenUniversityDetail = async (university) => {
    if (!university?.id) {
      return;
    }
    setDrawerMode('view');
    setDrawerOpen(true);
    try {
      await fetchUniversityProfile(university.id);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar el perfil de la universidad.');
      setDrawerOpen(false);
      clearUniversityProfile();
    }
  };

  const handleSelectUniversity = async (e, university) => {
    e.stopPropagation();
    if (!university?.id || selectingId) {
      return;
    }

    setSelectingId(university.id);
    try {
      await putSelectedUniversity(university.id);
      await restoreSession();
      toast.success('Universidad seleccionada correctamente');
    } catch (err) {
      console.error('Error al seleccionar universidad:', err);
      toast.error('No se pudo seleccionar la universidad.');
    } finally {
      setSelectingId(null);
    }
  };

  const isSelected = (id) => Number(user?.selected_university?.id) === Number(id);

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }

    pageChangeTimeoutRef.current = setTimeout(() => {
      setCurrentPage(safePage);
    }, 500);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    clearUniversityProfile();
    setSaveModal({
      isOpen: false,
      payload: null,
      logoFile: null,
      saveKind: 'create',
      universityId: null,
    });
  };

  const handleEditUniversity = async () => {
    if (!universityProfile?.id) {
      return;
    }
    try {
      const sig = buildRequestSignature({ resource: 'period-types' }, ['resource']);
      if (shouldRunCatalog(sig)) {
        await fetchPeriodTypes();
      }
      setEditFormKey((k) => k + 1);
      setDrawerMode('edit');
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar los tipos de periodo. Intenta de nuevo.');
    }
  };

  const handleFormSubmit = ({ payload, logoFile }) => {
    const isEdit = drawerMode === 'edit';
    setSaveModal({
      isOpen: true,
      payload,
      logoFile,
      saveKind: isEdit ? 'edit' : 'create',
      universityId: isEdit ? universityProfile?.id : null,
    });
  };

  const handleConfirmSave = async () => {
    const {
      payload,
      logoFile,
      saveKind,
      universityId,
    } = saveModal;
    if (!payload) {
      return;
    }

    try {
      if (saveKind === 'edit' && universityId) {
        await updateUniversityFullSetup(universityId, payload, logoFile);
        toast.success('Universidad actualizada correctamente');
      } else {
        await createUniversityFullSetup(payload, logoFile);
        toast.success('Universidad creada correctamente');
      }
      handleCloseDrawer();
      await fetchUniversities();
    } catch (err) {
      console.error(err);
      const fallback = saveKind === 'edit'
        ? 'No se pudo actualizar la universidad.'
        : 'No se pudo crear la universidad.';
      toast.error(parseApiError(err, fallback));
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

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
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (pageChangeTimeoutRef.current) {
        clearTimeout(pageChangeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Universidades"
        contextLabel="Gestiona las universidades del sistema."
        actionIcon={Plus}
        actionLabel="Nueva Universidad"
        actionVariant="primary"
        actionLoading={isOpeningCreate}
        actionLoadingLabel="Cargando..."
        actionDisabled={isOpeningCreate}
        onAction={handleOpenCreate}
      />

      <SurfacePanel padding="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-12 lg:col-span-6">
            <Input
              label="Buscar Universidad"
              placeholder="Nombre o nombre corto"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              reserveHelperSpace={false}
            />
          </div>

          <div className="md:col-span-12 lg:col-span-6 lg:col-start-7">
            <Select
              label="Ordenar"
              options={orderOptions}
              value={ordenAscendente ? 'asc' : 'desc'}
              onChange={handleOrderChange}
              reserveHelperSpace={false}
            />
          </div>
        </div>
      </SurfacePanel>

      {loading ? (
        <LoadingStatePanel message="Cargando universidades..." />
      ) : !filteredUniversities.length ? (
        <EmptyStatePanel
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          actionIcon={emptyState.actionIcon}
          actionLabel={emptyState.actionLabel}
          onAction={emptyState.onAction}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedUniversities.map((u) => {
              const selected = isSelected(u.id);
              const busy = selectingId === u.id;

              return (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenUniversityDetail(u)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenUniversityDetail(u);
                    }
                  }}
                  className={`rounded-xl border p-4 flex flex-col gap-3 bg-[var(--bg-elevated)] transition-shadow cursor-pointer hover:border-[var(--accent)]/50 ${
                    selected
                      ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]'
                      : 'border-[var(--border-default)]'
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{
                        backgroundColor: 'var(--accent-subtle, #dbeafe)',
                        color: 'var(--accent, #2563eb)',
                      }}
                    >
                      <School size={32} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[var(--text-primary)] break-words">
                        {u.name || '—'}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {u.short_name || '—'}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Horario: {formatTime(u.start_time)} - {formatTime(u.end_time)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex justify-between items-center pt-2 border-t border-[var(--border-default)]"
                  >
                    <button
                      type="button"
                      className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline disabled:opacity-50"
                      onClick={(e) => handleSelectUniversity(e, u)}
                      disabled={busy || selected}
                    >
                      {busy ? 'Seleccionando…' : selected ? 'Universidad activa' : 'Seleccionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            hasPreviousPage={currentPage > 1}
            hasNextPage={currentPage < totalPages}
          />
        </div>
      )}

      <SideDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={
          drawerMode === 'view' || drawerMode === 'edit'
            ? (universityProfile?.name || 'Universidad')
            : 'Nueva Universidad'
        }
        size="lg"
        headerIcon={
          drawerMode === 'view'
            ? Eye
            : drawerMode === 'edit'
              ? Pencil
              : Plus
        }
        headerBadge={
          drawerMode === 'view'
            ? 'Ver'
            : drawerMode === 'edit'
              ? 'Editar'
              : 'Crear'
        }
      >
        {drawerMode === 'view' ? (
          <UniversityDetail
            profile={universityProfile}
            isLoading={profileLoading}
            onClose={handleCloseDrawer}
            onEdit={handleEditUniversity}
          />
        ) : (
          <UniversityForm
            key={
              drawerMode === 'edit'
                ? `edit-${universityProfile?.id}-${editFormKey}`
                : `create-${formResetKey}`
            }
            mode={drawerMode === 'edit' ? 'edit' : 'create'}
            initialProfile={drawerMode === 'edit' ? universityProfile : null}
            periodTypeOptions={periodTypeOptions}
            isLoading={drawerMode === 'edit' ? updateLoading : createLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
          />
        )}
      </SideDrawer>

      <ConfirmModal
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({
          isOpen: false,
          payload: null,
          logoFile: null,
          saveKind: 'create',
          universityId: null,
        })}
        onConfirm={handleConfirmSave}
        title={saveModal.saveKind === 'edit' ? 'Confirmar cambios' : 'Confirmar creación'}
        message={
          saveModal.saveKind === 'edit'
            ? '¿Deseas guardar los cambios de esta universidad?'
            : '¿Deseas crear esta universidad con la información capturada?'
        }
        confirmLabel={saveModal.saveKind === 'edit' ? 'Guardar' : 'Crear'}
        closeOnConfirm={true}
      />
    </div>
  );
};
