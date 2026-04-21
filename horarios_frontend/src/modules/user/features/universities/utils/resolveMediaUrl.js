/**
 * Convierte `image_url` de la API en URL usable en `<img src>`.
 * Si la API devuelve absoluta (http/https), se usa tal cual.
 * Si es ruta relativa (/media/...), se antepone VITE_API_BASE_URL.
 */
export const resolveMediaUrl = (urlOrPath) => {
  if (urlOrPath == null || urlOrPath === '') {
    return null;
  }
  const s = String(urlOrPath).trim();
  if (/^(https?:|blob:|data:)/i.test(s)) {
    return s;
  }
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    return s.startsWith('/') ? s : `/${s}`;
  }
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
};
