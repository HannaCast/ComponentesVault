import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteAcademicPeriod,
  getAcademicPeriodsPaginated,
  postAcademicPeriod,
  putAcademicPeriod,
  toggleAcademicPeriodStatus,
} from '../api/universitiesApi';

export const useAcademicPeriods = () => {
  const [periods, setPeriods] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const lastQueryRef = useRef({ page: 1, limit: 10, search: '', sortBy: 'id', order: 'DESC' });

  const fetchPeriods = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'id',
    order = 'DESC'
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAcademicPeriodsPaginated({ page, limit, search, sortBy, order });
      const data = response.data?.data || [];
      const m = response.data?.meta || { page, limit, total: data.length };
      setPeriods(data);
      setMeta(m);
      lastQueryRef.current = { page, limit, search, sortBy, order };
    } catch (err) {
      console.error('Error al cargar periodos:', err);
      setError('No se pudieron cargar los periodos académicos.');
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPeriods = useCallback(() => {
    return fetchPeriods(lastQueryRef.current);
  }, [fetchPeriods]);

  const createPeriod = async (payload) => {
    try {
      await postAcademicPeriod(payload);
      toast.success('Periodo académico creado correctamente');
      refreshPeriods();
      return true;
    } catch (err) {
      console.error('Error al crear periodo:', err);
      toast.error('Ocurrió un error al crear el periodo');
      return false;
    }
  };

  const updatePeriod = async (id, payload) => {
    try {
      await putAcademicPeriod(id, payload);
      toast.success('Periodo académico actualizado correctamente');
      refreshPeriods();
      return true;
    } catch (err) {
      console.error('Error al actualizar periodo:', err);
      toast.error('Ocurrió un error al actualizar el periodo');
      return false;
    }
  };

  const removePeriod = async (id) => {
    try {
      await deleteAcademicPeriod(id);
      toast.success('Periodo académico eliminado correctamente');
      refreshPeriods();
      return true;
    } catch (err) {
      console.error('Error al eliminar periodo:', err);
      toast.error('Ocurrió un error al eliminar el periodo');
      return false;
    }
  };

  const toggleStatus = async (id) => {
    try {
      await toggleAcademicPeriodStatus(id);
      refreshPeriods();
      return true;
    } catch (err) {
      console.error('Error al cambiar estado del periodo:', err);
      toast.error('Ocurrió un error al cambiar el estado');
      return false;
    }
  };

  return {
    periods,
    meta,
    loading,
    error,
    fetchPeriods,
    refreshPeriods,
    createPeriod,
    updatePeriod,
    removePeriod,
    toggleStatus,
  };
};
