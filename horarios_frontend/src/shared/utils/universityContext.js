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