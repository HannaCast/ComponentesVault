const pickFirstNonEmptyString = (values) => values.find(
  (value) => typeof value === 'string' && value.trim(),
)?.trim() || '';

const extractMessageFromObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  for (const entry of Object.values(value)) {
    if (typeof entry === 'string' && entry.trim()) {
      return entry.trim();
    }

    if (Array.isArray(entry)) {
      const first = pickFirstNonEmptyString(entry);
      if (first) {
        return first;
      }
    }
  }

  return '';
};

export const parseUniversityApiError = (err, fallback) => {
  const data = err?.response?.data;
  const directMessage = pickFirstNonEmptyString([data?.message, err?.message]);
  if (directMessage) {
    return directMessage;
  }

  if (Array.isArray(data?.data)) {
    const first = pickFirstNonEmptyString(data.data);
    if (first) {
      return first;
    }
  }

  const objectMessage = extractMessageFromObject(data?.data);
  if (objectMessage) {
    return objectMessage;
  }

  if (data?.data != null && typeof data.data !== 'object') {
    return String(data.data);
  }

  return fallback;
};
