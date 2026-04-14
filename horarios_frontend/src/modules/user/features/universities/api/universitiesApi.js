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
 * Alta atómica: universidad + modalidades + turnos (+ periodos si aplica).
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
