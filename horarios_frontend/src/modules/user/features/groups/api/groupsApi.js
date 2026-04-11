import apiToken from '@requests/apiToken';

/** Listado reducido de grupos activos (p. ej. selects). */
export const getGroups = () => apiToken.get('/api/v1/university/groups/');

/** Lista paginada con filtros y orden (misma convención que materias). */
export const getGroupsPaginated = ({
  page = 1,
  limit = 10,
  search = '',
  status,
  careerId,
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

  if (careerId !== undefined && careerId !== null && careerId !== 'todas') {
    params.career_id = careerId;
  }

  return apiToken.get('/api/v1/university/groups/paginated/', { params });
};

export const getGroup = (id) =>
  apiToken.get(`/api/v1/university/groups/${id}/`);

export const createGroup = (data) =>
  apiToken.post('/api/v1/university/groups/', data);

export const updateGroup = (id, data) =>
  apiToken.put(`/api/v1/university/groups/${id}/`, data);

export const toggleGroupStatus = (id) =>
  apiToken.put(`/api/v1/university/groups/${id}/toggle-status/`);

export const deleteGroup = (id) =>
  apiToken.delete(`/api/v1/university/groups/${id}/`);

/** Carreras activas (mismo endpoint que materias). */
export { getCareers } from '../../careers/api/careersApi';

/** Turnos de la universidad seleccionada (header). */
export const getShifts = () =>
  apiToken.get('/api/v1/university/shifts/');
