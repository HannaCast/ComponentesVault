import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteShift,
  getShiftsPaginated,
  postShift,
  putShift,
} from '../api/universitiesApi';

export const useShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const lastQueryRef = useRef({ page: 1, limit: 10, search: '', sortBy: 'id', order: 'DESC' });

  const fetchShifts = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'id',
    order = 'DESC'
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getShiftsPaginated({ page, limit, search, sortBy, order });
      const data = response.data?.data || [];
      const m = response.data?.meta || { page, limit, total: data.length };
      setShifts(data);
      setMeta(m);
      lastQueryRef.current = { page, limit, search, sortBy, order };
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setError('No se pudieron cargar los turnos.');
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshShifts = useCallback(() => {
    return fetchShifts(lastQueryRef.current);
  }, [fetchShifts]);

  const createShift = async (payload) => {
    try {
      await postShift(payload);
      toast.success('Turno creado correctamente');
      refreshShifts();
      return true;
    } catch (err) {
      console.error('Error al crear turno:', err);
      toast.error('Ocurrió un error al crear el turno');
      return false;
    }
  };

  const updateShift = async (id, payload) => {
    try {
      await putShift(id, payload);
      toast.success('Turno actualizado correctamente');
      refreshShifts();
      return true;
    } catch (err) {
      console.error('Error al actualizar turno:', err);
      toast.error('Ocurrió un error al actualizar el turno');
      return false;
    }
  };

  const removeShift = async (id) => {
    try {
      await deleteShift(id);
      toast.success('Turno eliminado correctamente');
      refreshShifts();
      return true;
    } catch (err) {
      console.error('Error al eliminar turno:', err);
      toast.error('Ocurrió un error al eliminar el turno');
      return false;
    }
  };

  return {
    shifts,
    meta,
    loading,
    error,
    fetchShifts,
    refreshShifts,
    createShift,
    updateShift,
    removeShift,
  };
};
