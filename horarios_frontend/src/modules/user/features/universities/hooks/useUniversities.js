import { useCallback, useEffect, useRef, useState } from 'react';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import {
  createUniversity,
  deleteUniversityLogo,
  getUniversityImage,
  getUniversitiesPaginated,
  getUniversityProfile,
  getPeriodTypes,
  postFullUniversitySetup,
  putFullUniversitySetup,
  updateUniversity,
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
  const listFetchIdRef = useRef(0);
  const listImageUrlsRef = useRef([]);
  const profileImageUrlRef = useRef(null);
  const profileImageFetchingRef = useRef(null);

  const { shouldRun: shouldRunProfileImage } = useRequestDeduper({ windowMs: 500 });

  const revokeObjectUrl = useCallback((value) => {
    if (typeof value === 'string' && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
    }
  }, []);

  const resetListImageUrls = useCallback(() => {
    listImageUrlsRef.current.forEach(revokeObjectUrl);
    listImageUrlsRef.current = [];
  }, [revokeObjectUrl]);

  const resetProfileImageUrl = useCallback(() => {
    revokeObjectUrl(profileImageUrlRef.current);
    profileImageUrlRef.current = null;
  }, [revokeObjectUrl]);

  const fetchUniversityImageUrl = useCallback(async (universityId) => {
    const response = await getUniversityImage(universityId);
    const blob = response?.data;
    if (!(blob instanceof Blob) || blob.size <= 0) {
      return null;
    }
    return URL.createObjectURL(blob);
  }, []);

  const normalizeUniversitiesRows = useCallback((rows) => (
    rows.map((row) => ({
      ...row,
      image_url: null,
      image_loading: Boolean(row?.id && row?.image),
    }))
  ), []);

  const loadUniversitiesImagesInBackground = useCallback((rows, fetchId) => {
    rows.forEach((row) => {
      if (!row?.id || !row?.image) {
        return;
      }

      (async () => {
        let imageUrl = null;

        try {
          imageUrl = await fetchUniversityImageUrl(row.id);
        } catch {
          imageUrl = null;
        }

        if (fetchId !== listFetchIdRef.current) {
          revokeObjectUrl(imageUrl);
          return;
        }

        if (typeof imageUrl === 'string' && imageUrl.startsWith('blob:')) {
          listImageUrlsRef.current.push(imageUrl);
        }

        setUniversities((prev) => prev.map((item) => {
          if (Number(item?.id) !== Number(row.id)) {
            return item;
          }

          return {
            ...item,
            image_url: imageUrl,
            image_loading: false,
          };
        }));
      })();
    });
  }, [fetchUniversityImageUrl, revokeObjectUrl]);

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
      const fetchId = listFetchIdRef.current + 1;
      listFetchIdRef.current = fetchId;
      resetListImageUrls();

      const normalizedRows = normalizeUniversitiesRows(rows);
      setUniversities(normalizedRows);
      loadUniversitiesImagesInBackground(normalizedRows, fetchId);
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

      lastQueryRef.current = { page, limit, search, asc };
    } catch (err) {
      console.error('Error al cargar universidades:', err);
      setError('No se pudieron cargar las universidades. Intenta de nuevo.');
      resetListImageUrls();
      setUniversities([]);
      setUniversitiesMeta({ page: 1, limit: 10, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [loadUniversitiesImagesInBackground, normalizeUniversitiesRows, resetListImageUrls]);

  const fetchPeriodTypes = useCallback(async () => {
    const response = await getPeriodTypes();
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    setPeriodTypeOptions(rows);
    return rows;
  }, []);

  const fetchUniversityProfile = useCallback(async (universityId) => {
    setProfileLoading(true);
    resetProfileImageUrl();
    setUniversityProfile(null);
    try {
      const response = await getUniversityProfile(universityId);
      const data = response.data?.data ?? null;

      if (!data) {
        setUniversityProfile(null);
        return null;
      }

      let imageUrl = null;
      if (data.image && data.id) {
        const imgSignature = buildRequestSignature({ universityId: data.id, hasImage: true }, ['universityId', 'hasImage']);
        if (profileImageFetchingRef.current !== data.id && shouldRunProfileImage(imgSignature)) {
          profileImageFetchingRef.current = data.id;
          try {
            imageUrl = await fetchUniversityImageUrl(data.id);
          } catch {
            imageUrl = null;
          } finally {
            profileImageFetchingRef.current = null;
          }
        }
      }

      profileImageUrlRef.current = imageUrl;
      const profileWithImage = { ...data, image_url: imageUrl };
      setUniversityProfile(profileWithImage);
      return profileWithImage;
    } catch (err) {
      console.error('Error al cargar perfil de universidad:', err);
      setUniversityProfile(null);
      throw err;
    } finally {
      setProfileLoading(false);
    }
  }, [fetchUniversityImageUrl, resetProfileImageUrl, shouldRunProfileImage]);

  const clearUniversityProfile = useCallback(() => {
    resetProfileImageUrl();
    setUniversityProfile(null);
  }, [resetProfileImageUrl]);

  const createUniversityBase = useCallback(async (payload, logoFile) => {
    setCreateLoading(true);
    try {
      const response = await createUniversity(payload.university);
      const newId = response?.data?.data?.id;
      
      if (logoFile && newId) {
        try {
          await uploadUniversityLogo(newId, logoFile);
        } catch (uploadError) {
          console.error('La universidad se creó, pero el logo falló', uploadError);
        }
      }
      return { data: { data: { university_id: newId } } };
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const updateUniversityBase = useCallback(async (id, payload, logoFile, removeLogo) => {
    setUpdateLoading(true);
    try {
      await updateUniversity(id, payload.university);
      
      if (removeLogo) {
        await deleteUniversityLogo(id);
      } else if (logoFile) {
        await uploadUniversityLogo(id, logoFile);
      }
      
      return true;
    } finally {
      setUpdateLoading(false);
    }
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

  const updateUniversityFullSetup = useCallback(async (
    universityId,
    payload,
    logoFile,
    removeLogo = false,
  ) => {
    setUpdateLoading(true);
    try {
      const response = await putFullUniversitySetup(universityId, payload);

      if (universityId && removeLogo && !(logoFile instanceof File)) {
        await deleteUniversityLogo(universityId);
      }

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

  useEffect(() => {
    return () => {
      resetListImageUrls();
      resetProfileImageUrl();
    };
  }, [resetListImageUrls, resetProfileImageUrl]);

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
    createUniversityBase,
    updateUniversityBase,
    createUniversityFullSetup: createUniversityBase, // Mantener nombre temporalmente
    updateUniversityFullSetup: updateUniversityBase, // Mantener nombre temporalmente
    createLoading,
    updateLoading,
    universityProfile,
    profileLoading,
    fetchUniversityProfile,
    clearUniversityProfile,
    deleteUniversity,
  };
};
