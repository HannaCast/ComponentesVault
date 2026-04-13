export const parseUniversityApiError = (err, fallback) => {
  const d = err?.response?.data;
  if (typeof d?.message === 'string' && d.message.trim()) {
    return d.message;
  }
  if (Array.isArray(d?.data)) {
    const first = d.data.find((item) => typeof item === 'string' && item.trim());
    if (first) {
      return first;
    }
  }
  if (d?.data && typeof d.data === 'object') {
    const firstEntry = Object.values(d.data).find((value) => {
      if (typeof value === 'string' && value.trim()) {
        return true;
      }
      if (Array.isArray(value)) {
        return value.some((item) => typeof item === 'string' && item.trim());
      }
      return false;
    });
    if (typeof firstEntry === 'string' && firstEntry.trim()) {
      return firstEntry;
    }
    if (Array.isArray(firstEntry)) {
      const firstArrayMessage = firstEntry.find(
        (item) => typeof item === 'string' && item.trim()
      );
      if (firstArrayMessage) {
        return firstArrayMessage;
      }
    }
  }
  if (d?.data != null && typeof d.data !== 'object') {
    return String(d.data);
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  return fallback;
};
