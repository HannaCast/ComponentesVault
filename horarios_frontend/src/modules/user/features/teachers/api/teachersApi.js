import apiToken from '@requests/apiToken';

export const getTeachersPaginated = ({
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

  return apiToken.get('/api/v1/university/teachers/paginated/', { params });
};

export const getTeacher = (id) => apiToken.get(`/api/v1/university/teachers/${id}/`);

export const createTeacher = (data) => apiToken.post('/api/v1/university/teachers/', data);

export const updateTeacher = (id, data) =>
  apiToken.put(`/api/v1/university/teachers/${id}/`, data);

export const toggleTeacherStatus = (id) =>
  apiToken.put(`/api/v1/university/teachers/${id}/toggle-status/`);

export const deleteTeacher = (id) => apiToken.delete(`/api/v1/university/teachers/${id}/`);
