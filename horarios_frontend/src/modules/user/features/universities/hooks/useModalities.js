import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteModality,
  getModalitiesPaginated,
  postModality,
  putModality,
  toggleModalityStatus,
} from '../api/universitiesApi';

export const useModalities = () => {
  const [modalities, setModalities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const lastQueryRef = useRef({ page: 1, limit: 10, search: '', sortBy: 'id', order: 'DESC' });

  const fetchModalities = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'id',
    order = 'DESC'
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getModalitiesPaginated({ page, limit, search, sortBy, order });
      const data = response.data?.data || [];
      const m = response.data?.meta || { page, limit, total: data.length };
      setModalities(data);
      setMeta(m);
      lastQueryRef.current = { page, limit, search, sortBy, order };
    } catch (err) {
      console.error('Error al cargar modalidades:', err);
      setError('No se pudieron cargar las modalidades.');
      setModalities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshModalities = useCallback(() => {
    return fetchModalities(lastQueryRef.current);
  }, [fetchModalities]);

  const createModality = async (payload) => {
    try {
      await postModality(payload);
      toast.success('Modalidad creada correctamente');
      refreshModalities();
      return true;
    } catch (err) {
      console.error('Error al crear modalidad:', err);
      toast.error('Ocurrió un error al crear la modalidad');
      return false;
    }
  };

  const updateModality = async (id, payload) => {
    try {
      await putModality(id, payload);
      toast.success('Modalidad actualizada correctamente');
      refreshModalities();
      return true;
    } catch (err) {
      console.error('Error al actualizar modalidad:', err);
      toast.error('Ocurrió un error al actualizar la modalidad');
      return false;
    }
  };

  const removeModality = async (id) => {
    try {
      await deleteModality(id);
      toast.success('Modalidad eliminada correctamente');
      refreshModalities();
      return true;
    } catch (err) {
      console.error('Error al eliminar modalidad:', err);
      toast.error('Ocurrió un error al eliminar la modalidad');
      return false;
    }
  };

  const toggleStatus = async (id) => {
    try {
      await toggleModalityStatus(id);
      refreshModalities();
      return true;
    } catch (err) {
      console.error('Error al cambiar estado de modalidad:', err);
      toast.error('Ocurrió un error al cambiar el estado');
      return false;
    }
  };

  return {
    modalities,
    meta,
    loading,
    error,
    fetchModalities,
    refreshModalities,
    createModality,
    updateModality,
    removeModality,
    toggleStatus,
  };
};
