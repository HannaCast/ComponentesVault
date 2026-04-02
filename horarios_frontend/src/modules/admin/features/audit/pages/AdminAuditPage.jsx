import { useEffect, useRef, useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { SideDrawer } from '@shared/components/layout/SideDrawer';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { EntityListStateRenderer } from '@shared/components/tables/EntityListStateRenderer';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { AuditLogListItem } from '../components/AuditLogListItem';
import { AuditLogDetail } from '../components/AuditLogDetail';
import { useAuditLogs } from '../hooks/useAuditLogs';

const ITEMS_PER_PAGE = 10;

const getEmptyState = (searchTerm, entityFilter, actionFilter) => {
  const isDefaultState = !searchTerm && entityFilter === 'all' && actionFilter === 'all';

  if (isDefaultState) {
    return {
      icon: FileText,
      title: 'No hay registros de bitacora',
      description: 'Aun no se han registrado operaciones en el sistema.',
    };
  }

  return {
    icon: FileText,
    title: 'No se encontraron registros',
    description: 'Intenta con otros filtros o terminos de busqueda.',
  };
};

export const AdminAuditPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rowActionState, setRowActionState] = useState({ logId: null, action: null });
  const pageChangeTimeoutRef = useRef(null);
  const { shouldRun } = useRequestDeduper({ windowMs: 150 });

  const {
    auditLogsPage,
    totalItems,
    loading,
    error,
    setError,
    detailLoading,
    selectedLog,
    setSelectedLog,
    searchTerm,
    setSearchTerm,
    entityFilter,
    setEntityFilter,
    actionFilter,
    setActionFilter,
    orderDirection,
    setOrderDirection,
    entityOptions,
    actionOptions,
    fetchAuditLogs,
    fetchAuditLogDetail,
  } = useAuditLogs();

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isAnyRowActionRunning = rowActionState.logId !== null;
  const emptyState = getEmptyState(searchTerm, entityFilter, actionFilter);

  const handleOpenDetail = async (id) => {
    if (isAnyRowActionRunning) {
      return;
    }

    setRowActionState({ logId: id, action: 'view' });

    try {
      const detail = await fetchAuditLogDetail(id);
      if (detail) {
        setDrawerOpen(true);
      }
    } finally {
      setRowActionState({ logId: null, action: null });
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedLog(null);
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

  useEffect(() => {
    const queryParams = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm,
      entity: entityFilter,
      action: actionFilter,
      order: orderDirection,
    };

    const queryKey = buildRequestSignature(queryParams, ['page', 'limit', 'search', 'entity', 'action', 'order']);

    if (!shouldRun(queryKey)) {
      return;
    }

    fetchAuditLogs(queryParams);
  }, [
    currentPage,
    searchTerm,
    entityFilter,
    actionFilter,
    orderDirection,
    shouldRun,
    fetchAuditLogs,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, setSearchTerm]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, { id: 'admin-audit-page-error' });
    setError(null);
  }, [error, setError]);

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

  return (
    <div className="space-y-6">
      <PageSectionHeader
        title="Bitacora del Sistema"
        contextLabel="Registro de operaciones realizadas en aplicacion y base de datos"
      />

      <SurfacePanel>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input
            label="Buscar"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Usuario, accion, entidad o detalle"
            reserveHelperSpace={false}
          />

          <Select
            label="Entidad"
            value={entityFilter}
            onChange={(event) => {
              setEntityFilter(event.target.value);
              setCurrentPage(1);
            }}
            options={entityOptions}
            placeholder="Todas las entidades"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />

          <Select
            label="Operacion"
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value);
              setCurrentPage(1);
            }}
            options={actionOptions}
            placeholder="Todas las operaciones"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />

          <Select
            label="Orden"
            value={orderDirection}
            onChange={(event) => {
              setOrderDirection(event.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'desc', label: 'Mas recientes primero' },
              { value: 'asc', label: 'Mas antiguos primero' },
            ]}
            placeholder="Mas recientes primero"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />
        </div>
      </SurfacePanel>

      <EntityListStateRenderer
        loading={loading}
        loadingMessage="Cargando bitacora..."
        items={auditLogsPage}
        getItemKey={(log) => log.id}
        emptyState={emptyState}
        renderItem={(log, index) => (
          <AuditLogListItem
            log={log}
            onView={() => handleOpenDetail(log.id)}
            showBottomBorder={index < auditLogsPage.length - 1}
            loading={rowActionState.logId === log.id && rowActionState.action === 'view'}
            disabled={isAnyRowActionRunning && rowActionState.logId !== log.id}
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
        title={selectedLog ? `Detalle del registro #${selectedLog.id}` : 'Detalle de bitacora'}
        size="lg"
        headerIcon={Eye}
        headerBadge="Auditoria"
      >
        {detailLoading ? (
          <LoadingStatePanel message="Cargando detalle..." />
        ) : (
          <AuditLogDetail
            log={selectedLog}
            onClose={handleCloseDrawer}
          />
        )}
      </SideDrawer>
    </div>
  );
};
