import apiToken from '@requests/apiToken';

export const getUniversityDashboardSummary = () =>
  apiToken.get('/api/v1/university/dashboard/summary/');
