import apiToken from '@requests/apiToken';

export const getMyAccountInfo = () => apiToken.get('/api/v1/user/my-info/');

export const changeMyPassword = (payload) =>
  apiToken.put('/api/v1/auth/change-password/', payload, { encrypt: true });
