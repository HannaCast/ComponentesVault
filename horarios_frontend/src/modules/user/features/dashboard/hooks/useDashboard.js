import { useCallback, useRef, useState } from 'react';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { getUniversityDashboardSummary } from '../api/dashboardApi';

const DASHBOARD_CACHE_TTL_MS = 30_000;

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
  const summaryCacheRef = useRef({
    key: '',
    payload: null,
    ts: 0,
  });

  const { shouldRun: shouldRunSummaryRequest } = useRequestDeduper({ windowMs: 180 });

  const fetchDashboardSummary = useCallback(async (
    {
      silent = false,
      force = false,
      selectedUniversityId = null,
    } = {},
  ) => {
    const requestSignature = buildRequestSignature(
      {
        resource: 'dashboard-summary',
        selectedUniversityId,
      },
      ['resource', 'selectedUniversityId'],
    );

    const now = Date.now();
    const isCacheHit = (
      !force
      && summaryCacheRef.current.key === requestSignature
      && summaryCacheRef.current.payload !== null
      && (now - summaryCacheRef.current.ts) < DASHBOARD_CACHE_TTL_MS
    );

    if (isCacheHit) {
      setSummary(summaryCacheRef.current.payload);
      setLoading(false);
      if (!silent) {
        setError(null);
      }

      return {
        success: true,
        data: summaryCacheRef.current.payload,
        fromCache: true,
      };
    }

    if (!force && !shouldRunSummaryRequest(requestSignature)) {
      return {
        success: false,
        deduped: true,
        data: summaryCacheRef.current.key === requestSignature
          ? summaryCacheRef.current.payload
          : null,
      };
    }

    try {
      setLoading(true);
      if (!silent) {
        setError(null);
      }

      const response = await getUniversityDashboardSummary();
      const payload = response?.data?.data ?? null;

      summaryCacheRef.current = {
        key: requestSignature,
        payload,
        ts: Date.now(),
      };

      setSummary(payload);

      return {
        success: true,
        data: payload,
      };
    } catch (requestError) {
      console.error('Error al cargar resumen del dashboard:', requestError);
      const message = getApiErrorMessage(
        requestError,
        'No se pudo cargar el resumen del dashboard. Intenta nuevamente.',
      );

      if (!silent) {
        setError(message);
      }

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, [shouldRunSummaryRequest]);

  return {
    summary,
    loading,
    error,
    setError,
    fetchDashboardSummary,
  };
};
