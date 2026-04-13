import { useCallback, useRef, useState } from 'react';
import {
  getTeachersPaginated,
  getTeacher,
  updateTeacher,
  toggleTeacherStatus,
  deleteTeacher,
  createTeacher,
} from '../api/teachersApi';

const pickFirstNonEmptyString = (values) => values.find(
  (value) => typeof value === 'string' && value.trim(),
)?.trim() || '';

const extractFieldErrorMessage = (fieldErrors) => {
  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return '';
  }

  for (const value of Object.values(fieldErrors)) {
    if (Array.isArray(value)) {
      const first = pickFirstNonEmptyString(value);
      if (first) {
        return first;
      }
      continue;
    }

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

/** Mensaje legible desde ApiResponse.error (message / errores de campo). */
function extractApiErrorMessage(err) {
  const data = err?.response?.data;
  const directMessage = pickFirstNonEmptyString([
    data?.message,
    data?.detail,
    err?.message,
  ]);
  const fieldMessage = extractFieldErrorMessage(data?.data);

  return fieldMessage || directMessage;
}

export const useTeachers = () => {
  const [teachersPage, setTeachersPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const lastQueryRef = useRef({ page: 1, limit: 10 });

  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'activos', label: 'Activos' },
    { value: 'inactivos', label: 'Inactivos' },
  ];

  const fetchTeachers = useCallback(
    async (
      {
        page = 1,
        limit = 10,
        search = '',
        estado = 'todos',
        asc = true,
      } = {},
      { silent = false } = {},
    ) => {
      try {
        setLoading(true);
        if (!silent) {
          setError(null);
        }

        let status;
        if (estado === 'activos') {
          status = 'true';
        } else if (estado === 'inactivos') {
          status = 'false';
        }

        const order = asc ? 'ASC' : 'DESC';

        const response = await getTeachersPaginated({
          page,
          limit,
          search,
          status,
          sortBy: 'name',
          order,
        });

        setTeachersPage(Array.isArray(response.data?.data) ? response.data.data : []);
        setTotalItems(Number(response.data?.meta?.total) || 0);
        lastQueryRef.current = { page, limit, search, estado, asc };
        return true;
      } catch (err) {
        console.error('Error al cargar profesores:', err);
        if (!silent) {
          setError('No se pudieron cargar los profesores. Intenta de nuevo.');
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleToggleStatus = async (id) => {
    try {
      await toggleTeacherStatus(id);
      await fetchTeachers(lastQueryRef.current);
    } catch (err) {
      console.error('Error al actualizar profesor:', err);
      setError('No se pudo actualizar el estado del profesor.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteTeacher(deleteModal.id);
      await fetchTeachers(lastQueryRef.current);
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      console.error('Error al eliminar profesor:', err);
      setError('No se pudo eliminar el profesor.');
    }
  };

  const fetchTeacherById = useCallback(async (id) => {
    try {
      setTeacherLoading(true);
      setError(null);
      const response = await getTeacher(id);
      setSelectedTeacher(response.data?.data || response.data);
      return response.data?.data || response.data;
    } catch (err) {
      console.error('Error al cargar profesor:', err);
      setError('No se pudo cargar el profesor.');
      return null;
    } finally {
      setTeacherLoading(false);
    }
  }, []);

  const handleCreateTeacher = async (data) => {
    try {
      setTeacherLoading(true);
      setError(null);
      await createTeacher(data);
      const refreshed = await fetchTeachers(lastQueryRef.current, { silent: true });
      if (!refreshed) {
        return {
          success: true,
          softWarning:
            'El profesor se creó, pero no se pudo actualizar la lista. Recarga la página.',
        };
      }
      return { success: true };
    } catch (err) {
      console.error('Error al crear profesor:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo crear el profesor.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setTeacherLoading(false);
    }
  };

  const handleUpdateTeacher = async (id, data) => {
    try {
      setTeacherLoading(true);
      setError(null);
      await updateTeacher(id, data);
      const refreshed = await fetchTeachers(lastQueryRef.current, { silent: true });
      if (!refreshed) {
        return {
          success: true,
          softWarning:
            'Los cambios se guardaron, pero no se pudo actualizar la lista. Recarga la página.',
        };
      }
      return { success: true };
    } catch (err) {
      console.error('Error al actualizar profesor:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo actualizar el profesor.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setTeacherLoading(false);
    }
  };

  return {
    teachersPage,
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
    deleteModal,
    setDeleteModal,
    statusOptions,
    handleToggleStatus,
    handleDelete,
    fetchTeachers,
    selectedTeacher,
    setSelectedTeacher,
    teacherLoading,
    fetchTeacherById,
    handleCreateTeacher,
    handleUpdateTeacher,
  };
};
