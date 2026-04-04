import PropTypes from 'prop-types';
import { Eye, FileText } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';

const actionLabelMap = {
  CREATE: 'Crear',
  INSERT: 'Insertar',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  CHANGE_STATUS: 'Cambiar estado',
};

const sourceLabelMap = {
  APPLICATION: 'Aplicacion',
  DATABASE: 'Base de datos',
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString();
};

const getActionLabel = (action) => {
  return actionLabelMap[action] || action || '-';
};

const getSourceLabel = (source) => {
  return sourceLabelMap[source] || source || '-';
};

const getRecordLabel = (recordId) => {
  if (recordId === null || recordId === undefined || recordId === '') {
    return 'Sin registro';
  }

  return `Registro #${recordId}`;
};

const getErrorPreview = (message) => {
  if (!message) {
    return null;
  }

  const normalized = String(message).trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 120)}...`;
};

export const AuditLogListItem = ({
  log,
  onView,
  showBottomBorder = false,
  loading = false,
  disabled = false,
}) => {
  const isSuccess = Number(log?.is_succesfull) === 1;
  const statusLabel = isSuccess ? 'Exitosa' : 'Fallida';
  const errorPreview = getErrorPreview(log?.error_message);

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: 'var(--bg-elevated, #ffffff)',
        borderBottom: showBottomBorder ? '1px solid var(--border-subtle, #e5e7eb)' : 'none',
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-subtle, #eff6ff)' }}
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--accent, #2563eb)' }} />
            </div>

            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: 'var(--text-primary, #111827)' }}>
                {log?.table_name || 'Entidad no definida'}
              </p>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                {getRecordLabel(log?.record_id)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            <span>{formatDateTime(log?.created_at)}</span>
            <span>•</span>
            <span>Usuario: {log?.username || '-'}</span>
            <span>•</span>
            <span>ID: {log?.id}</span>
          </div>

          {errorPreview ? (
            <p className="text-sm" style={{ color: 'var(--error, #dc2626)' }} title={log?.error_message || undefined}>
              {errorPreview}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <div className="flex items-center gap-2 flex-wrap lg:justify-end">
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: 'var(--bg-surface, #f3f4f6)',
                color: 'var(--text-primary, #111827)',
                border: '1px solid var(--border-default, #d1d5db)',
              }}
            >
              {getActionLabel(log?.action)}
            </span>

            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: 'var(--bg-surface, #f3f4f6)',
                color: 'var(--text-primary, #111827)',
                border: '1px solid var(--border-default, #d1d5db)',
              }}
            >
              {getSourceLabel(log?.source)}
            </span>

            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-full"
              style={{
                backgroundColor: isSuccess ? 'rgba(22, 163, 74, 0.12)' : 'var(--error-subtle, #fef2f2)',
                color: isSuccess ? '#15803d' : 'var(--error, #dc2626)',
                border: isSuccess
                  ? '1px solid rgba(22, 163, 74, 0.2)'
                  : '1px solid var(--error-border, #fecaca)',
              }}
            >
              {statusLabel}
            </span>
          </div>

          <ActionButton
            icon={Eye}
            label="Ver detalle"
            onClick={onView}
            loading={loading}
            loadingLabel="Cargando..."
            disabled={disabled}
            variant="secondary"
            size="small"
            fullWidth={false}
          />
        </div>
      </div>
    </div>
  );
};

AuditLogListItem.propTypes = {
  log: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    username: PropTypes.string,
    table_name: PropTypes.string,
    record_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    action: PropTypes.string,
    source: PropTypes.string,
    is_succesfull: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error_message: PropTypes.string,
  }),
  onView: PropTypes.func,
  showBottomBorder: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};
