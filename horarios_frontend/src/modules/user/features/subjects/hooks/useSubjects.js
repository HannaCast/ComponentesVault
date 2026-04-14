import { useCallback, useRef, useState } from 'react';
import {
  getSubjectsPaginated,
  getSubject,
  updateSubject,
  toggleSubjectStatus,
  deleteSubject,
  createSubject,
  getColors,
  getCareers,
  getTeachers,
  getClassroomTypes,
} from '../api/subjectsApi';

export const useSubjects = () => {
  const [subjectsPage, setSubjectsPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [colorOptions, setColorOptions] = useState([]);
  const [careerOptions, setCareerOptions] = useState([]);
  const [professorOptions, setProfessorOptions] = useState([]);
  const [classroomTypeOptions, setClassroomTypeOptions] = useState([]);
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

      let status;
      if (estado === 'activos') {
        status = 'true';
      } else if (estado === 'inactivos') {
        status = 'false';
      }

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

  const handleToggleStatus = async (id) => {
    try {
      await toggleSubjectStatus(id);
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

  const fetchSubjectById = useCallback(async (id) => {
    try {
      setSubjectLoading(true);
      setError(null);
      const response = await getSubject(id);
      setSelectedSubject(response.data?.data || response.data);
      return response.data?.data || response.data;
    } catch (err) {
      console.error('Error al cargar materia:', err);
      setError('No se pudo cargar la materia.');
      return null;
    } finally {
      setSubjectLoading(false);
    }
  }, []);

  const handleCreateSubject = async (data) => {
    try {
      setSubjectLoading(true);
      setError(null);
      await createSubject(data);
      await fetchSubjects(lastQueryRef.current);
      return true;
    } catch (err) {
      console.error('Error al crear materia:', err);
      setError('No se pudo crear la materia.');
      return false;
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleUpdateSubject = async (id, data) => {
    try {
      setSubjectLoading(true);
      setError(null);
      await updateSubject(id, data);
      await fetchSubjects(lastQueryRef.current);
      return true;
    } catch (err) {
      console.error('Error al actualizar materia:', err);
      setError('No se pudo actualizar la materia.');
      return false;
    } finally {
      setSubjectLoading(false);
    }
  };

  const fetchColorOptions = useCallback(async () => {
    try {
      const response = await getColors();
      const colors = Array.isArray(response.data?.data) ? response.data.data : [];

      setColorOptions(
        colors.map((color) => ({
          value: String(color.id),
          label: color.name,
          hex: color.hex,
        }))
      );
    } catch (err) {
      console.error('Error al cargar colores:', err);
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
        }))
      );
    } catch (err) {
      console.error('Error al cargar carreras:', err);
    }
  }, []);

  const fetchProfessorOptions = useCallback(async () => {
    try {
      const response = await getTeachers();
      const teachers = Array.isArray(response.data?.data) ? response.data.data : [];

      setProfessorOptions(
        teachers.map((teacher) => ({
          value: String(teacher.id),
          label: teacher.full_name,
        }))
      );
    } catch (err) {
      console.error('Error al cargar profesores:', err);
    }
  }, []);

  const fetchClassroomTypeOptions = useCallback(async () => {
    try {
      const response = await getClassroomTypes();
      const classroomTypes = Array.isArray(response.data?.data) ? response.data.data : [];

      setClassroomTypeOptions(
        classroomTypes.map((classroomType) => ({
          value: String(classroomType.id),
          label: classroomType.name,
        }))
      );
    } catch (err) {
      console.error('Error al cargar tipos de aula:', err);
    }
  }, []);

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
    selectedSubject,
    setSelectedSubject,
    subjectLoading,
    fetchSubjectById,
    handleCreateSubject,
    handleUpdateSubject,
    colorOptions,
    fetchColorOptions,
    careerOptions,
    fetchCareerOptions,
    professorOptions,
    fetchProfessorOptions,
    classroomTypeOptions,
    fetchClassroomTypeOptions,
  };
};
