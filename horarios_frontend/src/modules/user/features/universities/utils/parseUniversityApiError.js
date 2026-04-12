export const parseUniversityApiError = (err, fallback) => {
  const d = err?.response?.data;
  if (typeof d?.message === 'string' && d.message.trim()) {
    return d.message;
  }
  if (d?.data != null && typeof d.data !== 'object') {
    return String(d.data);
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  return fallback;
};
