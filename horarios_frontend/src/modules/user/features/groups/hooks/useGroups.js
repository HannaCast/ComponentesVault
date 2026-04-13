import { useCallback, useRef, useState } from 'react';
import {
  createGroup,
  deleteGroup,
  getCareers,
  getGroup,
  getGroupsPaginated,
  getShifts,
  toggleGroupStatus,
  updateGroup,
} from '../api/groupsApi';

const normalizeApiMessage = (message) => {
  if (typeof message !== 'string') {
    return '';
  }

  const trimmed = message.trim();
  if (!trimmed || /^ha ocurrido un error$/i.test(trimmed)) {
    return '';
  }

  return trimmed;
};

const buildFieldErrorMessage = (data) => {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return '';
  }

  const parts = Object.entries(data).flatMap(([key, value]) => {
    if (value == null) {
      return [];
    }

    if (Array.isArray(value)) {
      const text = value.filter(Boolean).join(' ');
      return text ? [`${key}: ${text}`] : [];
    }

    if (typeof value === 'string') {
      return value ? [`${key}: ${value}`] : [];
    }

    return [];
  });

  return parts.join(' · ');
};

/** Extrae texto útil de ApiResponse.error (DRF) para mostrar al usuario. */
const formatGroupApiError = (err, fallback) => {
  const body = err?.response?.data;
  if (!body || typeof body !== 'object') {
    return fallback;
  }

  const message = normalizeApiMessage(body.message);
  if (message) {
    return message;
  }

  const fieldMessage = buildFieldErrorMessage(body.data);
  return fieldMessage || fallback;
};

export const useGroups = () => {
  const [groupsPage, setGroupsPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [careerFiltro, setCareerFiltro] = useState('todas');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [careerOptions, setCareerOptions] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);

  const lastQueryRef = useRef({ page: 1, limit: 10 });

  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'activos', label: 'Activos' },
    { value: 'inactivos', label: 'Inactivos' },
  ];

  const fetchGroups = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    estado = 'todos',
    asc = true,
    careerId = 'todas',
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      let status;
      if (estado === 'activos') {
        status = 'true';
      } else if (estado === 'inactivos') {
        status = 'false';
      }

      const order = asc ? 'ASC' : 'DESC';

      const response = await getGroupsPaginated({
        page,
        limit,
        search,
        status,
        careerId: careerId === 'todas' ? undefined : careerId,
        sortBy: 'name',
        order,
      });

      setGroupsPage(Array.isArray(response.data?.data) ? response.data.data : []);
      setTotalItems(Number(response.data?.meta?.total) || 0);
      lastQueryRef.current = {
        page, limit, search, estado, asc, careerId,
      };
    } catch (err) {
      console.error('Error al cargar grupos:', err);
      setError('No se pudieron cargar los grupos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCareerOptions = useCallback(async () => {
    try {
      const response = await getCareers();
      const careers = Array.isArray(response.data?.data) ? response.data.data : [];

      setCareerOptions(
        careers.map((career) => ({
          value: String(career.id),
          label: career.name,
          total_periods: Number(career.total_periods) || 0,
        })),
      );
    } catch (err) {
      console.error('Error al cargar carreras:', err);
    }
  }, []);

  const fetchShiftOptions = useCallback(async () => {
    try {
      const response = await getShifts();
      const shifts = Array.isArray(response.data?.data) ? response.data.data : [];

      setShiftOptions(
        shifts.map((shift) => ({
          value: String(shift.id),
          label: shift.name,
        })),
      );
    } catch (err) {
      console.error('Error al cargar turnos:', err);
    }
  }, []);

  const fetchGroupById = useCallback(async (id) => {
    try {
      setGroupLoading(true);
      setError(null);
      const response = await getGroup(id);
      const data = response.data?.data ?? response.data;
      setSelectedGroup(data);
      return data;
    } catch (err) {
      console.error('Error al cargar grupo:', err);
      setError('No se pudo cargar el grupo.');
      return null;
    } finally {
      setGroupLoading(false);
    }
  }, []);

  const handleCreateGroup = async (data) => {
    try {
      setGroupLoading(true);
      setError(null);
      await createGroup(data);
      await fetchGroups(lastQueryRef.current);
      return true;
    } catch (err) {
      console.error('Error al crear grupo:', err);
      setError(formatGroupApiError(err, 'No se pudo crear el grupo.'));
      return false;
    } finally {
      setGroupLoading(false);
    }
  };

  const handleUpdateGroup = async (id, data) => {
    try {
      setGroupLoading(true);
      setError(null);
      await updateGroup(id, data);
      await fetchGroups(lastQueryRef.current);
      return true;
    } catch (err) {
      console.error('Error al actualizar grupo:', err);
      setError(formatGroupApiError(err, 'No se pudo actualizar el grupo.'));
      return false;
    } finally {
      setGroupLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleGroupStatus(id);
      await fetchGroups(lastQueryRef.current);
    } catch (err) {
      console.error('Error al actualizar grupo:', err);
      setError('No se pudo actualizar el grupo.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteGroup(deleteModal.id);
      await fetchGroups(lastQueryRef.current);
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      console.error('Error al eliminar grupo:', err);
      setError('No se pudo eliminar el grupo.');
    }
  };

  return {
    groupsPage,
    totalItems,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    ordenAscendente,
    setOrdenAscendente,
    careerFiltro,
    setCareerFiltro,
    deleteModal,
    setDeleteModal,
    statusOptions,
    careerOptions,
    shiftOptions,
    fetchCareerOptions,
    fetchShiftOptions,
    fetchGroups,
    handleToggleStatus,
    handleDelete,
    selectedGroup,
    setSelectedGroup,
    groupLoading,
    fetchGroupById,
    handleCreateGroup,
    handleUpdateGroup,
  };
};
