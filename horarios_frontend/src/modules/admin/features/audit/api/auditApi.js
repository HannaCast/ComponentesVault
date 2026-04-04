import apiToken from '@requests/apiToken';

export const getAuditLogsPaginated = ({
  page = 1,
  limit = 10,
  search = '',
  entity = 'all',
  action = 'all',
  sortBy = 'created_at',
  order = 'DESC',
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

  if (entity && entity !== 'all') {
    params.entity = entity;
  }

  if (action && action !== 'all') {
    params.action = action;
  }

  return apiToken.get('/api/v1/audit/logs/paginated/', { params });
};

export const getAuditLogDetail = (id) => apiToken.get(`/api/v1/audit/logs/${id}/`);
