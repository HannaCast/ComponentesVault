import apiToken from '@requests/apiToken';

export const generateScheduleDraft = () =>
  apiToken.post('/api/v1/university/schedules/generate/');

export const getScheduleVersionsPaginated = ({
  page = 1,
  limit = 8,
  search = '',
  confirmed,
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
  }

  if (confirmed !== undefined && confirmed !== null && confirmed !== '') {
    params.confirmed = confirmed;
  }

  return apiToken.get('/api/v1/university/schedules/paginated/', { params });
};

export const getScheduleVersionById = (id) =>
  apiToken.get(`/api/v1/university/schedules/${id}/`);

export const confirmScheduleVersion = (id) =>
  apiToken.put(`/api/v1/university/schedules/${id}/confirm/`);

export const deleteScheduleDraft = (id) =>
  apiToken.delete(`/api/v1/university/schedules/drafts/${id}/`);

export const updateScheduleVersionLabel = (id, label) =>
  apiToken.put(`/api/v1/university/schedules/${id}/label/`, { label });
