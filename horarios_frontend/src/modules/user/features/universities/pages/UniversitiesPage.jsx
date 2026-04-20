import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, School, Trash2 } from 'lucide-react';
import { UniversityLogoMark } from '../components/UniversityLogoMark';
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
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { useUniversities } from '../hooks/useUniversities';
import { parseUniversityApiError } from '../utils/parseUniversityApiError';

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

export const UniversitiesPage = () => {
  const navigate = useNavigate();
  const { user, restoreSession } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [selectingId, setSelectingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });
  const ITEMS_PER_PAGE = 6;

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, university: null });
  const deleteInFlightRef = useRef(false);

  const {
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    ordenAscendente,
    setOrdenAscendente,
    fetchUniversities,
    universities,
    universitiesMeta,
    deleteUniversity,
  } = useUniversities();

  const totalItems = Number(universitiesMeta?.total) || 0;
  const totalPages = Math.max(1, Number(universitiesMeta?.totalPages) || 1);

  const buildListParams = useCallback((overrides = {}) => ({
    page: overrides.page ?? currentPage,
    limit: overrides.limit ?? ITEMS_PER_PAGE,
    search: overrides.search ?? searchTerm,
    asc: overrides.asc ?? ordenAscendente,
  }), [currentPage, ITEMS_PER_PAGE, searchTerm, ordenAscendente]);

  const fetchUniversitiesList = useCallback(async (overrides = {}) => {
    const params = buildListParams(overrides);
    const signature = buildRequestSignature(params, ['page', 'limit', 'search', 'asc']);

    if (!shouldRun(signature)) {
      return;
    }

    await fetchUniversities(params);
  }, [buildListParams, shouldRun, fetchUniversities]);

  const goToCreate = () => navigate('/usuario/universidades/nueva');
  const goToDetail = (id) => navigate(`/usuario/universidades/${id}`);

  const emptyState = getEmptyState(searchTerm, goToCreate);
  const hasUniversities = universities.length > 0;

  const handleOrderChange = (event) => {
    const value = event?.target?.value;
    setOrdenAscendente(value === 'asc');
    setCurrentPage(1);
  };

  const isSelected = (id) => Number(user?.selected_university?.id) === Number(id);

  const handleSelectUniversity = async (e, university) => {
    e.stopPropagation();
    if (!university?.id || selectingId != null || isSelected(university.id)) {
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

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }

    pageChangeTimeoutRef.current = setTimeout(() => {
      setCurrentPage(safePage);
    }, 500);
  };

  const handleRequestDelete = (event, university) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!university?.id) {
      return;
    }
    setDeleteModal({ isOpen: true, university });
  };

  const handleCloseDeleteModal = () => {
    if (deleteInFlightRef.current) {
      return;
    }
    setDeleteModal({ isOpen: false, university: null });
  };

  const handleConfirmDelete = async () => {
    const uni = deleteModal.university;
    if (!uni?.id || deleteInFlightRef.current) {
      return;
    }
    deleteInFlightRef.current = true;
    try {
      await deleteUniversity(uni.id);
      const label = uni.name || uni.short_name || 'Universidad';
      toast.success(`Se eliminó correctamente «${label}».`);
      setDeleteModal({ isOpen: false, university: null });
      await fetchUniversitiesList();
      if (Number(user?.selected_university?.id) === Number(uni.id)) {
        try {
          await putSelectedUniversity(null);
        } catch (clearErr) {
          console.error(clearErr);
        }
        await restoreSession();
      }
    } catch (err) {
      console.error(err);
      toast.error(parseUniversityApiError(err, 'No se pudo eliminar la universidad.'));
    } finally {
      deleteInFlightRef.current = false;
    }
  };

  useEffect(() => {
    fetchUniversitiesList();
  }, [fetchUniversitiesList]);

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
      return;
    }

    if (totalItems > 0 && Array.isArray(universities) && universities.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  }, [currentPage, totalPages, totalItems, universities]);

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

  const renderUniversitiesContent = () => {
    if (loading) {
      return <LoadingStatePanel message="Cargando universidades..." />;
    }

    if (hasUniversities) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {universities.map((u) => {
              const selected = isSelected(u.id);
              const selectionBusy = selectingId != null;
              const busy = selectingId === u.id;
              const detailTargetName = u.name || u.short_name || `universidad ${u.id}`;
              let selectionLabel = 'Seleccionar universidad';

              if (busy) {
                selectionLabel = 'Aplicando…';
              } else if (selected) {
                selectionLabel = 'Universidad activa';
              }

              return (
                <div
                  key={u.id}
                  className={`relative rounded-xl border p-4 pt-3 flex flex-col gap-3 bg-[var(--bg-elevated)] transition-shadow hover:border-[var(--accent)]/50 text-left ${
                    selected
                      ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]'
                      : 'border-[var(--border-default)]'
                  }`}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#2563eb)]/40"
                    onClick={() => goToDetail(u.id)}
                    aria-label={`Ver detalle de ${detailTargetName}`}
                  />

                  <button
                    type="button"
                    className="absolute top-2.5 right-2.5 z-10 inline-flex items-center justify-center rounded-lg p-2 border border-transparent bg-[var(--bg-elevated)]/90 shadow-sm hover:bg-red-50 hover:border-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                    style={{ color: 'var(--error, #dc2626)' }}
                    aria-label={`Eliminar universidad ${u.name || u.short_name || u.id}`}
                    onClick={(e) => handleRequestDelete(e, u)}
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2.25} aria-hidden />
                  </button>

                  <div className="relative z-10 flex gap-3 pr-12">
                    <UniversityLogoMark
                      imageUrl={u.image_url}
                      isLoading={Boolean(u.image_loading)}
                      name={u.name || u.short_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-[var(--text-primary)] break-words leading-snug">
                        {u.name || '—'}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">Nombre corto:</span>
                        {' '}
                        {u.short_name || '—'}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] tabular-nums">
                        <span className="font-medium text-[var(--text-primary)]">Horario:</span>
                        {' '}
                        {formatTime(u.start_time)}
                        {' '}
                        –
                        {' '}
                        {formatTime(u.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                    <button
                      type="button"
                      className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline px-1 py-0.5 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToDetail(u.id);
                      }}
                      aria-label={`Ver detalle de ${detailTargetName}`}
                    >
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline disabled:opacity-50 px-1 py-0.5 rounded"
                      onClick={(e) => handleSelectUniversity(e, u)}
                      disabled={selectionBusy || selected}
                    >
                      {selectionLabel}
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
      );
    }

    return (
      <EmptyStatePanel
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        actionIcon={emptyState.actionIcon}
        actionLabel={emptyState.actionLabel}
        onAction={emptyState.onAction}
      />
    );
  };

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Universidades"
        contextLabel="Gestiona las universidades del sistema."
        actionIcon={Plus}
        actionLabel="Nueva Universidad"
        actionVariant="primary"
        onAction={goToCreate}
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
              showPlaceholderOption={false}
              reserveHelperSpace={false}
            />
          </div>
        </div>
      </SurfacePanel>

      {renderUniversitiesContent()}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Eliminar universidad"
        message={
          deleteModal.university
            ? `¿Estás seguro de que deseas eliminar la universidad «${
              deleteModal.university.name
              || deleteModal.university.short_name
              || 'seleccionada'
            }»? Esta acción no se puede deshacer.`
            : '¿Estás seguro de que deseas eliminar esta universidad? Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        closeOnConfirm={false}
        zIndex={80}
      />
    </div>
  );
};
