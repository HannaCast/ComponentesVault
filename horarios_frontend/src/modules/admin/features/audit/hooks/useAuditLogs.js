import { useCallback, useRef, useState } from 'react';
import { getAuditLogDetail, getAuditLogsPaginated } from '../api/auditApi';

const getEntityLabel = (entityName) => {
  if (!entityName) {
    return '-';
  }

  return entityName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const buildEntityOptions = (entitiesSet) => {
  const entities = Array.from(entitiesSet).sort((a, b) => a.localeCompare(b));

  return [
    { value: 'all', label: 'Todas las entidades' },
    ...entities.map((entity) => ({
      value: entity,
      label: getEntityLabel(entity),
    })),
  ];
};

export const useAuditLogs = () => {
  const [auditLogsPage, setAuditLogsPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [entityOptions, setEntityOptions] = useState([{ value: 'all', label: 'Todas las entidades' }]);
  const actionOptions = [
    { value: 'all', label: 'Todas las operaciones' },
    { value: 'INSERT', label: 'INSERT (Aplicacion)' },
    { value: 'CREATE', label: 'CREATE (Base de datos)' },
    { value: 'UPDATE', label: 'UPDATE' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'CHANGE_STATUS', label: 'CHANGE_STATUS' },
  ];

  const knownEntitiesRef = useRef(new Set());

  const fetchAuditLogs = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    entity = 'all',
    action = 'all',
    order = 'desc',
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const orderValue = order === 'asc' ? 'ASC' : 'DESC';

      const response = await getAuditLogsPaginated({
        page,
        limit,
        search,
        entity,
        action,
        order: orderValue,
      });

      const logs = Array.isArray(response.data?.data) ? response.data.data : [];
      const total = Number(response.data?.meta?.total) || 0;

      setAuditLogsPage(logs);
      setTotalItems(total);

      logs.forEach((log) => {
        if (log?.table_name) {
          knownEntitiesRef.current.add(log.table_name);
        }
      });

      if (entity && entity !== 'all') {
        knownEntitiesRef.current.add(entity);
      }

      setEntityOptions(buildEntityOptions(knownEntitiesRef.current));
    } catch (err) {
      console.error('Error al cargar bitacora:', err);
      setError('No se pudo cargar la bitacora. Intenta de nuevo.');
      setAuditLogsPage([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogDetail = useCallback(async (id) => {
    if (!id) {
      return null;
    }

    try {
      setDetailLoading(true);
      setError(null);

      const response = await getAuditLogDetail(id);
      const detail = response.data?.data || response.data;

      setSelectedLog(detail || null);
      return detail || null;
    } catch (err) {
      console.error('Error al cargar detalle de bitacora:', err);
      setError('No se pudo cargar el detalle del registro.');
      setSelectedLog(null);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return {
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
  };
};
