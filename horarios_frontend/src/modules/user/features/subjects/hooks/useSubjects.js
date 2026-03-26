import { useEffect, useState } from 'react';
import { getSubjects, updateSubject, deleteSubject } from '../api/subjectsApi';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const statusOptions = [
    { value: 'todos', label: 'Todas' },
    { value: 'activos', label: 'Activas' },
    { value: 'inactivos', label: 'Inactivas' },
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSubjects();
      setSubjects(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Error al cargar materias:', err);
      setError('No se pudieron cargar las materias. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const subjectsFiltered = subjects
    .filter((subject) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchNombre = subject.name?.toLowerCase().includes(search);
        const matchCodigo = subject.code?.toLowerCase().includes(search);
        if (!matchNombre && !matchCodigo) return false;
      }

      if (estadoFiltro === 'activos' && !subject.is_active) return false;
      if (estadoFiltro === 'inactivos' && subject.is_active) return false;

      return true;
    })
    .sort((a, b) => {
      const comparison = (a.name || '').localeCompare(b.name || '');
      return ordenAscendente ? comparison : -comparison;
    });

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateSubject(id, { is_active: !currentStatus });
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !currentStatus } : s))
      );
    } catch (err) {
      console.error('Error al actualizar materia:', err);
      setError('No se pudo actualizar la materia.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteSubject(deleteModal.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      console.error('Error al eliminar materia:', err);
      setError('No se pudo eliminar la materia.');
    }
  };

  return {
    subjects,
    subjectsFiltered,
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
