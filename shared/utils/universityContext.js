export const getSelectedUniversityDisplayName = (
  selectedUniversity,
  fallback = 'Universidad seleccionada',
) => {
  if (!selectedUniversity) {
    return fallback;
  }

  if (typeof selectedUniversity === 'string') {
    return selectedUniversity;
  }

  const fullName = String(selectedUniversity.name || '').trim();
  const shortName = String(selectedUniversity.short_name || '').trim();

  if (fullName && shortName && fullName.toLowerCase() !== shortName.toLowerCase()) {
    return `${fullName} (${shortName})`;
  }

  return fullName || shortName || fallback;
};

export const getSelectedUniversityId = (selectedUniversity) => {
  if (selectedUniversity === null || selectedUniversity === undefined) {
    return null;
  }

  const parseId = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  };

  if (typeof selectedUniversity === 'number' || typeof selectedUniversity === 'string') {
    return parseId(selectedUniversity);
  }

  if (typeof selectedUniversity === 'object') {
    return parseId(selectedUniversity.id ?? selectedUniversity.university_id ?? null);
  }

  return null;
};