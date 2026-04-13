import { useCallback, useRef, useState } from 'react';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import {
  confirmScheduleVersion,
  deleteScheduleDraft,
  generateScheduleDraft,
  getScheduleVersionById,
  getScheduleVersionsPaginated,
  updateScheduleVersionLabel,
} from '../api/scheduleGeneratorApi';

const DEFAULT_HISTORY_QUERY = {
  page: 1,
  limit: 8,
  search: '',
};

const EMPTY_PENDING_ACTION = {
  type: null,
  versionId: null,
};

const getResponseData = (response) => response?.data?.data ?? null;

const pickFirstNonEmptyString = (values) => values.find(
  (value) => typeof value === 'string' && value.trim(),
)?.trim() || '';

const extractMessageFromFieldErrors = (fieldErrors) => {
  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return '';
  }

  for (const value of Object.values(fieldErrors)) {
    if (Array.isArray(value)) {
      const first = pickFirstNonEmptyString(value);
      if (first) {
        return first;
      }
      continue;
    }

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const extractApiErrorMessage = (err, fallbackMessage) => {
  const data = err?.response?.data;
  const directMessage = pickFirstNonEmptyString([
    data?.message,
    data?.detail,
    err?.message,
  ]);
  const fieldMessage = extractMessageFromFieldErrors(data?.data);

  return fieldMessage || directMessage || fallbackMessage;
};

export const useScheduleGenerator = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({
    page: DEFAULT_HISTORY_QUERY.page,
    limit: DEFAULT_HISTORY_QUERY.limit,
    total: 0,
    totalPages: 1,
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedVersionLoading, setSelectedVersionLoading] = useState(false);

  const [pendingAction, setPendingAction] = useState(EMPTY_PENDING_ACTION);

  const pendingActionRef = useRef(EMPTY_PENDING_ACTION);
  const lastHistoryQueryRef = useRef(DEFAULT_HISTORY_QUERY);

  const { shouldRun: shouldRunHistory } = useRequestDeduper({ windowMs: 180 });
  const { shouldRun: shouldRunDetail } = useRequestDeduper({ windowMs: 180 });
  const { shouldRun: shouldRunMutation } = useRequestDeduper({ windowMs: 220 });

  const setActionState = useCallback((nextAction) => {
    pendingActionRef.current = nextAction;
    setPendingAction(nextAction);
  }, []);

  const beginAction = useCallback((actionType, versionId = null) => {
    if (pendingActionRef.current.type) {
      return false;
    }

    setActionState({ type: actionType, versionId });
    return true;
  }, [setActionState]);

  const endAction = useCallback(() => {
    setActionState(EMPTY_PENDING_ACTION);
  }, [setActionState]);

  const fetchHistory = useCallback(async (
    {
      page = DEFAULT_HISTORY_QUERY.page,
      limit = DEFAULT_HISTORY_QUERY.limit,
      search = DEFAULT_HISTORY_QUERY.search,
      confirmed,
    } = {},
    {
      silent = false,
      force = false,
    } = {},
  ) => {
    const querySignature = buildRequestSignature(
      {
        page,
        limit,
        search,
        confirmed,
      },
      ['page', 'limit', 'search', 'confirmed'],
    );

    if (!force && !shouldRunHistory(querySignature)) {
      return { success: false, deduped: true };
    }

    try {
      setHistoryLoading(true);
      if (!silent) {
        setHistoryError(null);
      }

      const response = await getScheduleVersionsPaginated({
        page,
        limit,
        search,
        confirmed,
      });

      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const meta = response?.data?.meta || {};

      setHistoryItems(rows);
      setHistoryMeta({
        page: Number(meta.page) || page,
        limit: Number(meta.limit) || limit,
        total: Number(meta.total) || 0,
        totalPages: Math.max(1, Number(meta.totalPages) || 1),
      });

      lastHistoryQueryRef.current = {
        page,
        limit,
        search,
        confirmed,
      };

      return {
        success: true,
        rows,
        meta,
      };
    } catch (err) {
      console.error('Error al cargar historial de versiones:', err);
      if (!silent) {
        setHistoryError(extractApiErrorMessage(err, 'No se pudo cargar el historial de versiones.'));
      }

      return {
        success: false,
        message: extractApiErrorMessage(err, 'No se pudo cargar el historial de versiones.'),
      };
    } finally {
      setHistoryLoading(false);
    }
  }, [shouldRunHistory]);

  const loadVersionDetail = useCallback(async (versionId, { force = false, silent = false } = {}) => {
    if (!versionId) {
      return { success: false, message: 'Version no valida.' };
    }

    const querySignature = buildRequestSignature(
      { versionId },
      ['versionId'],
    );

    if (!force && !shouldRunDetail(querySignature)) {
      return { success: false, deduped: true };
    }

    try {
      setSelectedVersionLoading(true);
      if (!silent) {
        setHistoryError(null);
      }

      const response = await getScheduleVersionById(versionId);
      const detail = getResponseData(response);

      setSelectedVersionId(versionId);
      setSelectedVersion(detail);

      return {
        success: true,
        data: detail,
      };
    } catch (err) {
      console.error('Error al cargar detalle de version:', err);

      const message = extractApiErrorMessage(err, 'No se pudo cargar el detalle de la version.');
      if (!silent) {
        setHistoryError(message);
      }

      return {
        success: false,
        message,
      };
    } finally {
      setSelectedVersionLoading(false);
    }
  }, [shouldRunDetail]);

  const generateScheduleVersion = useCallback(async () => {
    const actionType = 'generate';

    if (!beginAction(actionType)) {
      return {
        success: false,
        message: 'Ya hay una accion en proceso. Espera a que termine.',
      };
    }

    if (!shouldRunMutation('schedule-generate')) {
      endAction();
      return {
        success: false,
        deduped: true,
      };
    }

    try {
      const response = await generateScheduleDraft();
      const detail = getResponseData(response);

      if (detail?.id) {
        setSelectedVersionId(detail.id);
        setSelectedVersion(detail);
      }

      await fetchHistory(lastHistoryQueryRef.current, {
        silent: true,
        force: true,
      });

      return {
        success: true,
        data: detail,
        message: response?.data?.message,
      };
    } catch (err) {
      console.error('Error al generar horario:', err);
      return {
        success: false,
        message: extractApiErrorMessage(err, 'No se pudo generar el horario.'),
      };
    } finally {
      endAction();
    }
  }, [beginAction, endAction, fetchHistory, shouldRunMutation]);

  const confirmVersionById = useCallback(async (versionId) => {
    const actionType = 'confirm';

    if (!beginAction(actionType, versionId)) {
      return {
        success: false,
        message: 'Ya hay una accion en proceso. Espera a que termine.',
      };
    }

    const mutationSignature = buildRequestSignature({ actionType, versionId }, ['actionType', 'versionId']);
    if (!shouldRunMutation(mutationSignature)) {
      endAction();
      return {
        success: false,
        deduped: true,
      };
    }

    try {
      const response = await confirmScheduleVersion(versionId);
      const detail = getResponseData(response);

      if (detail?.id && Number(detail.id) === Number(selectedVersionId)) {
        setSelectedVersion(detail);
      }

      await fetchHistory(lastHistoryQueryRef.current, {
        silent: true,
        force: true,
      });

      return {
        success: true,
        data: detail,
        message: response?.data?.message,
      };
    } catch (err) {
      console.error('Error al confirmar version:', err);
      return {
        success: false,
        message: extractApiErrorMessage(err, 'No se pudo confirmar la version.'),
      };
    } finally {
      endAction();
    }
  }, [beginAction, endAction, fetchHistory, selectedVersionId, shouldRunMutation]);

  const deleteDraftById = useCallback(async (versionId) => {
    const actionType = 'delete';

    if (!beginAction(actionType, versionId)) {
      return {
        success: false,
        message: 'Ya hay una accion en proceso. Espera a que termine.',
      };
    }

    const mutationSignature = buildRequestSignature({ actionType, versionId }, ['actionType', 'versionId']);
    if (!shouldRunMutation(mutationSignature)) {
      endAction();
      return {
        success: false,
        deduped: true,
      };
    }

    try {
      await deleteScheduleDraft(versionId);

      const refreshResult = await fetchHistory(lastHistoryQueryRef.current, {
        silent: true,
        force: true,
      });

      if (Number(selectedVersionId) === Number(versionId)) {
        const rows = Array.isArray(refreshResult?.rows) ? refreshResult.rows : [];
        const preferredVersion = rows.find((row) => Number(row?.is_confirmed) === 0) || rows[0] || null;

        if (preferredVersion?.id) {
          await loadVersionDetail(preferredVersion.id, {
            silent: true,
            force: true,
          });
        } else {
          setSelectedVersionId(null);
          setSelectedVersion(null);
        }
      }

      return {
        success: true,
      };
    } catch (err) {
      console.error('Error al eliminar borrador:', err);
      return {
        success: false,
        message: extractApiErrorMessage(err, 'No se pudo eliminar el borrador.'),
      };
    } finally {
      endAction();
    }
  }, [beginAction, endAction, fetchHistory, loadVersionDetail, selectedVersionId, shouldRunMutation]);

  const renameVersionById = useCallback(async (versionId, label) => {
    const normalizedLabel = String(label || '').trim();

    if (!normalizedLabel) {
      return {
        success: false,
        message: 'El nombre de la version no puede estar vacio.',
      };
    }

    const actionType = 'rename';
    if (!beginAction(actionType, versionId)) {
      return {
        success: false,
        message: 'Ya hay una accion en proceso. Espera a que termine.',
      };
    }

    const mutationSignature = buildRequestSignature({ actionType, versionId, normalizedLabel }, ['actionType', 'versionId', 'normalizedLabel']);
    if (!shouldRunMutation(mutationSignature)) {
      endAction();
      return {
        success: false,
        deduped: true,
      };
    }

    try {
      const response = await updateScheduleVersionLabel(versionId, normalizedLabel);
      const detail = getResponseData(response);

      if (detail?.id && Number(detail.id) === Number(selectedVersionId)) {
        setSelectedVersion(detail);
      }

      await fetchHistory(lastHistoryQueryRef.current, {
        silent: true,
        force: true,
      });

      return {
        success: true,
        data: detail,
        message: response?.data?.message,
      };
    } catch (err) {
      console.error('Error al actualizar label de version:', err);
      return {
        success: false,
        message: extractApiErrorMessage(err, 'No se pudo actualizar el nombre de la version.'),
      };
    } finally {
      endAction();
    }
  }, [beginAction, endAction, fetchHistory, selectedVersionId, shouldRunMutation]);

  return {
    historyItems,
    historyMeta,
    historyLoading,
    historyError,
    setHistoryError,

    selectedVersionId,
    selectedVersion,
    selectedVersionLoading,

    pendingAction,
    isMutating: Boolean(pendingAction.type),

    fetchHistory,
    loadVersionDetail,

    generateScheduleVersion,
    confirmVersionById,
    deleteDraftById,
    renameVersionById,
  };
};
