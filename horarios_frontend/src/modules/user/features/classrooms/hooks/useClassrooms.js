import { useCallback, useRef, useState } from 'react';
import {
  createClassroom,
  createClassroomCareer,
  deleteClassroom,
  deleteClassroomCareer,
  getCareers,
  getClassroom,
  getClassroomCareers,
  getClassroomSubjectOptions,
  getClassroomSubjectPeriods,
  getClassroomTypes,
  getClassroomsPaginated,
  toggleClassroomStatus,
  updateClassroom,
} from '../api/classroomsApi';

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
const formatClassroomApiError = (err, fallback) => {
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

export const useClassrooms = () => {
  const [classroomsPage, setClassroomsPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState('todos');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [typeOptions, setTypeOptions] = useState([]);
  const [careerOptions, setCareerOptions] = useState([]);

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomLoading, setClassroomLoading] = useState(false);

  const [classroomCareerLinks, setClassroomCareerLinks] = useState([]);
  const [classroomCareersLoading, setClassroomCareersLoading] = useState(false);

  const lastQueryRef = useRef({
    page: 1,
    limit: 10,
    search: '',
    estado: 'todos',
    asc: true,
    tipo: 'todos',
  });

  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'activos', label: 'Activas' },
    { value: 'inactivos', label: 'Inactivas' },
  ];

  const fetchClassrooms = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    estado = 'todos',
    asc = true,
    tipo = 'todos',
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

      const response = await getClassroomsPaginated({
        page,
        limit,
        search,
        status,
        classroomTypeId: tipo === 'todos' ? undefined : tipo,
        sortBy: 'name',
        order,
      });

      setClassroomsPage(Array.isArray(response.data?.data) ? response.data.data : []);
      setTotalItems(Number(response.data?.meta?.total) || 0);
      lastQueryRef.current = {
        page,
        limit,
        search,
        estado,
        asc,
        tipo,
      };
    } catch (err) {
      console.error('Error al cargar aulas:', err);
      setError('No se pudieron cargar las aulas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTypeOptions = useCallback(async () => {
    try {
      const response = await getClassroomTypes();
      const types = Array.isArray(response.data?.data) ? response.data.data : [];

      setTypeOptions(
        types.map((type) => ({
          value: String(type.id),
          label: type.name,
        })),
      );
    } catch (err) {
      console.error('Error al cargar tipos de aula:', err);
    }
  }, []);

  const fetchCareerOptions = useCallback(async () => {
    try {
      const response = await getCareers();
      const careers = Array.isArray(response.data?.data) ? response.data.data : [];

      setCareerOptions(
        careers.map((career) => ({
          value: String(career.id),
          label: career.short_name
            ? `${career.name} (${career.short_name})`
            : career.name,
          short_name: career.short_name || '',
          total_periods: career.total_periods,
        })),
      );
    } catch (err) {
      console.error('Error al cargar carreras:', err);
    }
  }, []);

  const fetchClassroomSubjectPeriodsByCareer = useCallback(async (careerId) => {
    if (careerId == null || careerId === '') {
      return [];
    }

    try {
      const response = await getClassroomSubjectPeriods({ careerId });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];

      return rows.map((row) => {
        const periodValue = row?.period_number ?? row?.value;
        return {
          value: String(periodValue),
          label: row?.label || `Periodo ${periodValue}`,
          period_number: Number(periodValue),
        };
      });
    } catch (err) {
      console.error('Error al cargar periodos por carrera:', err);
      return [];
    }
  }, []);

  const fetchClassroomSubjectOptionsByCareerPeriod = useCallback(async ({ careerId, periodNumber }) => {
    if (careerId == null || careerId === '' || periodNumber == null || periodNumber === '') {
      return [];
    }

    try {
      const response = await getClassroomSubjectOptions({ careerId, periodNumber });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];

      return rows.map((row) => {
        const idValue = row?.id;
        const name = String(row?.name || '').trim();
        const code = String(row?.code || '').trim();
        return {
          value: String(idValue),
          label: code ? `${name} (${code})` : name,
          id: Number(idValue),
          name,
          code,
          career_id: row?.career_id,
          period_number: row?.period_number,
        };
      });
    } catch (err) {
      console.error('Error al cargar materias por carrera/periodo:', err);
      return [];
    }
  }, []);

  const fetchClassroomById = useCallback(async (id) => {
    try {
      setClassroomLoading(true);
      setError(null);
      const response = await getClassroom(id);
      const data = response.data?.data ?? response.data;
      setSelectedClassroom(data);
      return data;
    } catch (err) {
      console.error('Error al cargar aula:', err);
      setError('No se pudo cargar la aula.');
      return null;
    } finally {
      setClassroomLoading(false);
    }
  }, []);

  const fetchClassroomCareersForClassroom = useCallback(async (classroomId) => {
    if (!classroomId) {
      setClassroomCareerLinks([]);
      return;
    }

    try {
      setClassroomCareersLoading(true);
      const response = await getClassroomCareers({ classroomId });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setClassroomCareerLinks(rows);
    } catch (err) {
      console.error('Error al cargar carreras del aula:', err);
      setClassroomCareerLinks([]);
    } finally {
      setClassroomCareersLoading(false);
    }
  }, []);

  const handleAddClassroomCareer = async ({ classroomId, careerId }) => {
    try {
      setError(null);
      await createClassroomCareer({
        classrooms: classroomId,
        careers: careerId,
      });
      await fetchClassroomCareersForClassroom(classroomId);
      return true;
    } catch (err) {
      console.error('Error al asignar carrera al aula:', err);
      setError(formatClassroomApiError(err, 'No se pudo asignar la carrera al aula.'));
      return false;
    }
  };

  const handleRemoveClassroomCareer = async (linkId, classroomId) => {
    try {
      setError(null);
      await deleteClassroomCareer(linkId);
      await fetchClassroomCareersForClassroom(classroomId);
      return true;
    } catch (err) {
      console.error('Error al quitar carrera del aula:', err);
      setError(formatClassroomApiError(err, 'No se pudo quitar la carrera del aula.'));
      return false;
    }
  };

  const handleCreateClassroom = async (data) => {
    try {
      setClassroomLoading(true);
      setError(null);
      const response = await createClassroom(data);
      const created = response.data?.data ?? null;
      await fetchClassrooms(lastQueryRef.current);
      return created;
    } catch (err) {
      console.error('Error al crear aula:', err);
      setError(formatClassroomApiError(err, 'No se pudo crear la aula.'));
      return null;
    } finally {
      setClassroomLoading(false);
    }
  };

  const handleUpdateClassroom = async (id, data) => {
    try {
      setClassroomLoading(true);
      setError(null);
      const response = await updateClassroom(id, data);
      const updated = response.data?.data ?? null;
      await fetchClassrooms(lastQueryRef.current);
      if (updated) {
        setSelectedClassroom(updated);
      }
      return updated;
    } catch (err) {
      console.error('Error al actualizar aula:', err);
      setError(formatClassroomApiError(err, 'No se pudo actualizar la aula.'));
      return null;
    } finally {
      setClassroomLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleClassroomStatus(id);
      await fetchClassrooms(lastQueryRef.current);
    } catch (err) {
      console.error('Error al actualizar aula:', err);
      setError(formatClassroomApiError(err, 'No se pudo actualizar la aula.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteClassroom(deleteModal.id);
      await fetchClassrooms(lastQueryRef.current);
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (err) {
      console.error('Error al eliminar aula:', err);
      setError(formatClassroomApiError(err, 'No se pudo eliminar la aula.'));
    }
  };

  return {
    classroomsPage,
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
    tipoFiltro,
    setTipoFiltro,
    deleteModal,
    setDeleteModal,
    statusOptions,
    typeOptions,
    careerOptions,
    fetchTypeOptions,
    fetchCareerOptions,
    fetchClassrooms,
    handleToggleStatus,
    handleDelete,
    selectedClassroom,
    setSelectedClassroom,
    classroomLoading,
    fetchClassroomById,
    handleCreateClassroom,
    handleUpdateClassroom,
    classroomCareerLinks,
    classroomCareersLoading,
    fetchClassroomCareersForClassroom,
    handleAddClassroomCareer,
    handleRemoveClassroomCareer,
    fetchClassroomSubjectPeriodsByCareer,
    fetchClassroomSubjectOptionsByCareerPeriod,
  };
};
