import { useCallback, useRef, useState } from 'react';
import {
  createCareer,
  createCareerPeriodException,
  deleteCareer,
  deleteCareerPeriodException,
  getCareer,
  getCareerPeriodExceptions,
  getCareersPaginated,
  getModalities,
  toggleCareerStatus,
  updateCareer,
} from '../api/careersApi';

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

export const useCareers = () => {
  const [careersPage, setCareersPage] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [modalidadFiltro, setModalidadFiltro] = useState('todas');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [modalitiesOptions, setModalitiesOptions] = useState([]);

  const [selectedCareer, setSelectedCareer] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);
  const [periodExceptions, setPeriodExceptions] = useState([]);
  const [periodExceptionsLoading, setPeriodExceptionsLoading] = useState(false);

  const lastQueryRef = useRef({ page: 1, limit: 10 });

  const statusOptions = [
    { value: 'todos', label: 'Todas' },
    { value: 'activos', label: 'Activas' },
    { value: 'inactivos', label: 'Inactivas' },
  ];

  const fetchCareers = useCallback(
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

        const response = await getCareersPaginated({
          page,
          limit,
          search,
          status,
          sortBy: 'name',
          order,
        });

        setCareersPage(Array.isArray(response.data?.data) ? response.data.data : []);
        setTotalItems(Number(response.data?.meta?.total) || 0);
        lastQueryRef.current = { page, limit, search, estado, asc };
        return true;
      } catch (err) {
        console.error('Error al cargar carreras:', err);
        if (!silent) {
          const msg =
            extractApiErrorMessage(err) || 'No se pudieron cargar las carreras. Intenta de nuevo.';
          setError(msg);
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchModalitiesOptions = useCallback(async () => {
    try {
      const response = await getModalities();
      const modalities = Array.isArray(response.data?.data) ? response.data.data : [];

      setModalitiesOptions(
        modalities.map((modality) => ({
          value: String(modality.id),
          label: modality.name,
        })),
      );
    } catch (err) {
      console.error('Error al cargar modalidades:', err);
    }
  }, []);

  const fetchCareerById = useCallback(async (id) => {
    try {
      setCareerLoading(true);
      setError(null);
      const response = await getCareer(id);
      const data = response.data?.data ?? response.data;
      setSelectedCareer(data);
      return data;
    } catch (err) {
      console.error('Error al cargar carrera:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo cargar la carrera.';
      setError(msg);
      return null;
    } finally {
      setCareerLoading(false);
    }
  }, []);

  const fetchPeriodExceptionsForCareer = useCallback(async (careerId) => {
    if (!careerId) {
      setPeriodExceptions([]);
      return;
    }

    try {
      setPeriodExceptionsLoading(true);
      const response = await getCareerPeriodExceptions({ careerId });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setPeriodExceptions(rows);
    } catch (err) {
      console.error('Error al cargar excepciones de periodos:', err);
      setPeriodExceptions([]);
    } finally {
      setPeriodExceptionsLoading(false);
    }
  }, []);

  const handleCreateCareer = async (data) => {
    try {
      setCareerLoading(true);
      setError(null);
      const response = await createCareer(data);
      const created = response.data?.data ?? null;
      const refreshed = await fetchCareers(lastQueryRef.current, { silent: true });
      if (!refreshed && created) {
        setError(
          'La carrera se creó, pero no se pudo actualizar la lista. Recarga la página.',
        );
      }
      return created;
    } catch (err) {
      console.error('Error al crear carrera:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo crear la carrera.';
      setError(msg);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  const handleUpdateCareer = async (id, data) => {
    try {
      setCareerLoading(true);
      setError(null);
      const response = await updateCareer(id, data);
      const updated = response.data?.data ?? null;
      const refreshed = await fetchCareers(lastQueryRef.current, { silent: true });
      if (!refreshed && updated) {
        setError(
          'Los cambios se guardaron, pero no se pudo actualizar la lista. Recarga la página.',
        );
      }
      if (updated) {
        setSelectedCareer(updated);
      }
      return updated;
    } catch (err) {
      console.error('Error al actualizar carrera:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo actualizar la carrera.';
      setError(msg);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  const handleCreatePeriodException = async ({ careerId, period_number, reason }) => {
    try {
      setError(null);
      await createCareerPeriodException({
        career: careerId,
        period_number,
        reason: reason?.trim() || '',
      });
      await fetchPeriodExceptionsForCareer(careerId);
      return true;
    } catch (err) {
      console.error('Error al crear excepción:', err);
      const msg =
        extractApiErrorMessage(err) || 'No se pudo registrar la excepción de periodo.';
      setError(msg);
      return false;
    }
  };

  const handleDeletePeriodException = async (exceptionId, careerId) => {
    try {
      setError(null);
      await deleteCareerPeriodException(exceptionId);
      await fetchPeriodExceptionsForCareer(careerId);
      return true;
    } catch (err) {
      console.error('Error al eliminar excepción:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo eliminar la excepción.';
      setError(msg);
      return false;
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleCareerStatus(id);
      await fetchCareers(lastQueryRef.current);
    } catch (err) {
      console.error('Error al actualizar carrera:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo actualizar la carrera.';
      setError(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteCareer(deleteModal.id);
      await fetchCareers(lastQueryRef.current);
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (err) {
      console.error('Error al eliminar carrera:', err);
      const msg = extractApiErrorMessage(err) || 'No se pudo eliminar la carrera.';
      setError(msg);
    }
  };

  return {
    careersPage,
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
    modalidadFiltro,
    setModalidadFiltro,
    deleteModal,
    setDeleteModal,
    statusOptions,
    modalitiesOptions,
    fetchModalitiesOptions,
    fetchCareers,
    handleToggleStatus,
    handleDelete,
    selectedCareer,
    setSelectedCareer,
    careerLoading,
    fetchCareerById,
    handleCreateCareer,
    handleUpdateCareer,
    periodExceptions,
    periodExceptionsLoading,
    fetchPeriodExceptionsForCareer,
    handleCreatePeriodException,
    handleDeletePeriodException,
  };
};
