// tokenStore.js — access token en sessionStorage
// Sobrevive recargas dentro de la misma pestaña, pero se borra al cerrarla.
// El refresh token sigue en HttpOnly cookie → nunca accesible desde JS.
const KEY = 'access_token';

export const setAccessToken = (token) => sessionStorage.setItem(KEY, token);
export const getAccessToken = () => sessionStorage.getItem(KEY);
export const clearAccessToken = () => sessionStorage.removeItem(KEY);
