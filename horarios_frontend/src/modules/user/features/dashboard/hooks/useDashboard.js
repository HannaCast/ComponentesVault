import { useCallback, useState } from 'react';
import { getUniversityDashboardSummary } from '../api/dashboardApi';

const normalizeApiMessage = (message) => {
  if (typeof message !== 'string') {
    return '';
  }

  const trimmed = message.trim();
  if (!trimmed || /^ha ocurrido un error$/i.test(trimmed)) {
    return '';
  }

  return trimmed;
};

const getApiErrorMessage = (error, fallback) => {
  const message = normalizeApiMessage(error?.response?.data?.message);
  return message || fallback;
};

export const useDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardSummary = useCallback(async ({ silent = false } = {}) => {
    try {
      setLoading(true);
      if (!silent) {
        setError(null);
      }

      const response = await getUniversityDashboardSummary();
      const payload = response?.data?.data ?? null;
      setSummary(payload);
      return payload;
    } catch (requestError) {
      console.error('Error al cargar resumen del dashboard:', requestError);
      if (!silent) {
        setError(
          getApiErrorMessage(
            requestError,
            'No se pudo cargar el resumen del dashboard. Intenta nuevamente.',
          ),
        );
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    summary,
    loading,
    error,
    setError,
    fetchDashboardSummary,
  };
};
