import apiToken from '@requests/apiToken';

/** Carreras activas (select / materias), misma ruta que el listado reducido del backend. */
export const getCareers = () => apiToken.get('/api/v1/university/careers/');

export const getCareersPaginated = ({
  page = 1,
  limit = 10,
  search = '',
  status,
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

  if (status !== undefined && status !== null) {
    params.status = status;
  }

  return apiToken.get('/api/v1/university/careers/paginated/', { params });
};

export const toggleCareerStatus = (id) =>
  apiToken.put(`/api/v1/university/careers/${id}/toggle-status/`);

export const deleteCareer = (id) =>
  apiToken.delete(`/api/v1/university/careers/${id}/`);

export const getModalities = () =>
  apiToken.get('/api/v1/university/modalities/');

export const getCareer = (id) =>
  apiToken.get(`/api/v1/university/careers/${id}/`);

export const createCareer = (data) =>
  apiToken.post('/api/v1/university/careers/', data);

export const updateCareer = (id, data) =>
  apiToken.put(`/api/v1/university/careers/${id}/`, data);

export const getCareerPeriodExceptions = ({ careerId } = {}) => {
  const params = {};
  if (careerId != null && careerId !== '') {
    params.career = careerId;
  }
  return apiToken.get('/api/v1/university/career-period-exceptions/', { params });
};

export const createCareerPeriodException = (data) =>
  apiToken.post('/api/v1/university/career-period-exceptions/', data);

export const deleteCareerPeriodException = (id) =>
  apiToken.delete(`/api/v1/university/career-period-exceptions/${id}/`);

