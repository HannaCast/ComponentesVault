import { useCallback, useRef, useState } from 'react';
import { getSubjectsPaginated, updateSubject, deleteSubject } from '../api/subjectsApi';

export const useSubjects = () => {
  const [subjectsPage, setSubjectsPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const lastQueryRef = useRef({ page: 1, limit: 10 });

  const statusOptions = [
    { value: 'todos', label: 'Todas' },
    { value: 'activos', label: 'Activas' },
    { value: 'inactivos', label: 'Inactivas' },
  ];

  const fetchSubjects = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    estado = 'todos',
    asc = true,
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const status =
        estado === 'todos'
          ? undefined
          : estado === 'activos'
          ? 'true'
          : 'false';

      const order = asc ? 'ASC' : 'DESC';

      const response = await getSubjectsPaginated({
        page,
        limit,
        search,
        status,
        sortBy: 'name',
        order,
      });

      setSubjectsPage(Array.isArray(response.data?.data) ? response.data.data : []);
      setTotalItems(Number(response.data?.meta?.total) || 0);
      lastQueryRef.current = { page, limit, search, estado, asc };
    } catch (err) {
      console.error('Error al cargar materias:', err);
      setError('No se pudieron cargar las materias. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateSubject(id, { is_active: !currentStatus });
      await fetchSubjects(lastQueryRef.current);
    } catch (err) {
      console.error('Error al actualizar materia:', err);
      setError('No se pudo actualizar la materia.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteSubject(deleteModal.id);
      await fetchSubjects(lastQueryRef.current);
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      console.error('Error al eliminar materia:', err);
      setError('No se pudo eliminar la materia.');
    }
  };

  return {
    subjectsPage,
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
    fetchSubjects,
  };
};
