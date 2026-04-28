import apiToken from '@requests/apiToken';

// Obtener universidades paginadas con filtros/orden desde backend
export const getUniversitiesPaginated = ({
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'name',
  order = 'ASC',
} = {}) => {
  const params = {
    page,
    limit,
    sortBy,
    order,
  };

  if (search) {
    params.search = search;
  }

  return apiToken.get('/api/v1/universities/', { params });
};

export const deleteUniversity = (universityId) =>
  apiToken.delete(`/api/v1/universities/${universityId}/`);

export const getUniversityProfile = (universityId) =>
  apiToken.get(`/api/v1/universities/${universityId}/profile/`);

export const getUniversityImage = (universityId) =>
  apiToken.get(`/api/v1/universities/${universityId}/image/`, {
    responseType: 'blob',
  });

/**
 * @param {number|null} universityId - Id de universidad o `null` para dejar sin universidad activa.
 */
export const putSelectedUniversity = (universityId) =>
  apiToken.put('/api/v1/user/configurations/selected-university/', {
    selected_university_id: universityId,
  });

export const getPeriodTypes = () =>
  apiToken.get('/api/v1/period-types/');

/**
 * Crea la universidad (solo los datos generales).
 */
export const createUniversity = (payload) =>
  apiToken.post('/api/v1/universities/create/', payload);

/**
 * Actualiza la universidad (solo los datos generales).
 */
export const updateUniversity = (universityId, payload) =>
  apiToken.put(`/api/v1/universities/${universityId}/`, payload);

/**
 * Alta atómica (Legacy): universidad + modalidades + turnos (+ periodos si aplica).
 */
export const postFullUniversitySetup = (payload) =>
  apiToken.post('/api/setup/university-complete/', payload);

export const putFullUniversitySetup = (universityId, payload) =>
  apiToken.put(`/api/v1/universities/${universityId}/full-setup/`, payload);

export const uploadUniversityLogo = (universityId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return apiToken.post(`/api/universities/${universityId}/upload-image/`, formData, {
    // apiToken usa Content-Type: application/json por defecto; con FormData hay que
    // quitarlo para que el navegador envíe multipart/form-data;boundary=...
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData) {
          if (headers && typeof headers.delete === 'function') {
            headers.delete('Content-Type');
          } else if (headers) {
            delete headers['Content-Type'];
          }
        }
        return data;
      },
    ],
  });
};

export const deleteUniversityLogo = (universityId) =>
  apiToken.delete(`/api/universities/${universityId}/upload-image/`);

// ==========================================
// ENDPOINTS DE RELACIONES (Periodos, Turnos, Modalidades)
// ==========================================

export const getAcademicPeriodsPaginated = (params) =>
  apiToken.get('/api/v1/university/academic-periods/', { params });

export const postAcademicPeriod = (payload) =>
  apiToken.post('/api/v1/university/academic-periods/', payload);

export const putAcademicPeriod = (id, payload) =>
  apiToken.put(`/api/v1/university/academic-periods/${id}/`, payload);

export const deleteAcademicPeriod = (id) =>
  apiToken.delete(`/api/v1/university/academic-periods/${id}/`);

export const toggleAcademicPeriodStatus = (id) =>
  apiToken.put(`/api/v1/university/academic-periods/${id}/toggle-status/`);


export const getShiftsPaginated = (params) =>
  apiToken.get('/api/v1/university/shifts/', { params });

export const postShift = (payload) =>
  apiToken.post('/api/v1/university/shifts/', payload);

export const putShift = (id, payload) =>
  apiToken.put(`/api/v1/university/shifts/${id}/`, payload);

export const deleteShift = (id) =>
  apiToken.delete(`/api/v1/university/shifts/${id}/`);


export const getModalitiesPaginated = (params) =>
  apiToken.get('/api/v1/university/modalities/paginated/', { params });

export const postModality = (payload) =>
  apiToken.post('/api/v1/university/modalities/', payload);

export const putModality = (id, payload) =>
  apiToken.put(`/api/v1/university/modalities/${id}/`, payload);

export const deleteModality = (id) =>
  apiToken.delete(`/api/v1/university/modalities/${id}/`);

export const toggleModalityStatus = (id) =>
  apiToken.put(`/api/v1/university/modalities/${id}/toggle-status/`);
