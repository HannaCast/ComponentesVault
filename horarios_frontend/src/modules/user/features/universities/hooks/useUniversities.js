import { useCallback, useRef, useState } from 'react';
import {
  getUniversitiesPaginated,
  getUniversityProfile,
  getPeriodTypes,
  postFullUniversitySetup,
  putFullUniversitySetup,
  uploadUniversityLogo,
  deleteUniversity as deleteUniversityRequest,
} from '../api/universitiesApi';

export const useUniversities = () => {
  const [universities, setUniversities] = useState([]);
  const [universitiesMeta, setUniversitiesMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [periodTypeOptions, setPeriodTypeOptions] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [universityProfile, setUniversityProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const lastQueryRef = useRef({
    page: 1,
    limit: 10,
    search: '',
    asc: true,
  });

  const fetchUniversities = useCallback(async ({
    page = 1,
    limit = 10,
    search = '',
    asc = true,
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const order = asc ? 'ASC' : 'DESC';

      const response = await getUniversitiesPaginated({
        page,
        limit,
        search,
        sortBy: 'name',
        order,
      });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      const meta = response.data?.meta;

      if (meta && typeof meta === 'object') {
        setUniversitiesMeta({
          page: Number(meta.page) || 1,
          limit: Number(meta.limit) || limit,
          total: Number(meta.total) || 0,
          totalPages: Number(meta.totalPages) || 1,
        });
      } else {
        const fallbackLimit = Number(limit) || rows.length || 1;
        setUniversitiesMeta({
          page: Number(page) || 1,
          limit: fallbackLimit,
          total: rows.length,
          totalPages: fallbackLimit > 0 ? Math.max(1, Math.ceil(rows.length / fallbackLimit)) : 1,
        });
      }

      setUniversities(rows);
      lastQueryRef.current = { page, limit, search, asc };
    } catch (err) {
      console.error('Error al cargar universidades:', err);
      setError('No se pudieron cargar las universidades. Intenta de nuevo.');
      setUniversities([]);
      setUniversitiesMeta({ page: 1, limit: 10, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPeriodTypes = useCallback(async () => {
    const response = await getPeriodTypes();
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    setPeriodTypeOptions(rows);
    return rows;
  }, []);

  const fetchUniversityProfile = useCallback(async (universityId) => {
    setProfileLoading(true);
    setUniversityProfile(null);
    try {
      const response = await getUniversityProfile(universityId);
      const data = response.data?.data ?? null;
      setUniversityProfile(data);
      return data;
    } catch (err) {
      console.error('Error al cargar perfil de universidad:', err);
      setUniversityProfile(null);
      throw err;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const clearUniversityProfile = useCallback(() => {
    setUniversityProfile(null);
  }, []);

  const createUniversityFullSetup = useCallback(async (payload, logoFile) => {
    setCreateLoading(true);
    try {
      const response = await postFullUniversitySetup(payload);
      const uniId = response.data?.data?.university_id;

      if (uniId && logoFile instanceof File) {
        await uploadUniversityLogo(uniId, logoFile);
      }

      return response;
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const updateUniversityFullSetup = useCallback(async (universityId, payload, logoFile) => {
    setUpdateLoading(true);
    try {
      const response = await putFullUniversitySetup(universityId, payload);

      if (universityId && logoFile instanceof File) {
        await uploadUniversityLogo(universityId, logoFile);
      }

      return response;
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  const deleteUniversity = useCallback(async (universityId) => {
    const response = await deleteUniversityRequest(universityId);
    return response;
  }, []);

  return {
    universities,
    universitiesMeta,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    ordenAscendente,
    setOrdenAscendente,
    fetchUniversities,
    periodTypeOptions,
    fetchPeriodTypes,
    createUniversityFullSetup,
    updateUniversityFullSetup,
    createLoading,
    updateLoading,
    universityProfile,
    profileLoading,
    fetchUniversityProfile,
    clearUniversityProfile,
    deleteUniversity,
  };
};
