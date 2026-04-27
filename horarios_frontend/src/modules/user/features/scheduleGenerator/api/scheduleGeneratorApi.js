import apiToken from '@requests/apiToken';

export const generateScheduleDraft = (academicPeriodId = null, parameters = null) => {
  const payload = {};
  if (academicPeriodId) {
    payload.academic_period_id = academicPeriodId;
  }
  if (parameters) {
    payload.parameters = parameters;
  }
  return apiToken.post('/api/v1/university/schedules/generate/', payload);
};

export const getScheduleVersionsPaginated = ({
  page = 1,
  limit = 8,
  search = '',
  confirmed,
  academic_period_id,
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

  if (academic_period_id !== undefined && academic_period_id !== null) {
    params.academic_period_id = academic_period_id;
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
