import { useCallback, useMemo, useState } from 'react';
import {
  getUniversities,
  getUniversityProfile,
  getPeriodTypes,
  postFullUniversitySetup,
  putFullUniversitySetup,
  uploadUniversityLogo,
  deleteUniversity as deleteUniversityRequest,
} from '../api/universitiesApi';

export const useUniversities = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [periodTypeOptions, setPeriodTypeOptions] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [universityProfile, setUniversityProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUniversities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUniversities();
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setUniversities(rows);
    } catch (err) {
      console.error('Error al cargar universidades:', err);
      setError('No se pudieron cargar las universidades. Intenta de nuevo.');
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

  const filteredUniversities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = Array.isArray(universities) ? [...universities] : [];

    if (q) {
      rows = rows.filter((u) => {
        const name = String(u.name || '').toLowerCase();
        const shortName = String(u.short_name || '').toLowerCase();
        return name.includes(q) || shortName.includes(q);
      });
    }

    rows.sort((a, b) => {
      const an = String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });
      return ordenAscendente ? an : -an;
    });

    return rows;
  }, [universities, searchTerm, ordenAscendente]);

  return {
    universities,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    ordenAscendente,
    setOrdenAscendente,
    fetchUniversities,
    filteredUniversities,
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
