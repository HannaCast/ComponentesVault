import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

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

const formatTextValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const parseJsonField = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

const formatJsonForView = (value) => {
  const parsed = parseJsonField(value);

  if (parsed === null || parsed === undefined) {
    return '-';
  }

  if (typeof parsed === 'string') {
    return parsed;
  }

  try {
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(parsed);
  }
};

const DetailField = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary, #6b7280)' }}>
      {label}
    </p>
    <p className="text-sm break-words" style={{ color: 'var(--text-primary, #111827)' }}>
      {formatTextValue(value)}
    </p>
  </div>
);

DetailField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export const AuditLogDetail = ({ log, onClose }) => {
  if (!log) {
    return null;
  }

  const isSuccess = Number(log.is_succesfull) === 1;

  return (
    <div className="space-y-5 py-1">
      <SurfacePanel>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase font-semibold" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Registro de bitacora
            </p>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              #{log.id}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: 'var(--bg-surface, #f3f4f6)',
                color: 'var(--text-primary, #111827)',
                border: '1px solid var(--border-default, #d1d5db)',
              }}
            >
              {log.action || '-'}
            </span>
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: 'var(--bg-surface, #f3f4f6)',
                color: 'var(--text-primary, #111827)',
                border: '1px solid var(--border-default, #d1d5db)',
              }}
            >
              {log.source || '-'}
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
              {isSuccess ? 'Exitosa' : 'Fallida'}
            </span>
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="Fecha y hora" value={formatDateTime(log.created_at)} />
          <DetailField label="Usuario" value={log.username} />
          <DetailField label="ID de usuario" value={log.user_id} />
          <DetailField label="Entidad" value={log.table_name} />
          <DetailField label="ID de registro" value={log.record_id} />
          <DetailField label="ID de transaccion" value={log.transaction_id} />
          <DetailField label="IP" value={log.ip_address} />
          <DetailField label="User agent" value={log.user_agent} />
        </div>
      </SurfacePanel>

      {log.error_message ? (
        <SurfacePanel>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Mensaje de error
          </p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--error, #dc2626)' }}>
            {log.error_message}
          </p>
        </SurfacePanel>
      ) : null}

      <SurfacePanel>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Datos anteriores (old_data)
        </p>
        <pre
          className="text-xs sm:text-sm overflow-x-auto p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-surface, #f3f4f6)',
            color: 'var(--text-primary, #111827)',
            border: '1px solid var(--border-subtle, #e5e7eb)',
          }}
        >
          {formatJsonForView(log.old_data)}
        </pre>
      </SurfacePanel>

      <SurfacePanel>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Datos nuevos (new_data)
        </p>
        <pre
          className="text-xs sm:text-sm overflow-x-auto p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-surface, #f3f4f6)',
            color: 'var(--text-primary, #111827)',
            border: '1px solid var(--border-subtle, #e5e7eb)',
          }}
        >
          {formatJsonForView(log.new_data)}
        </pre>
      </SurfacePanel>

      <div className="pt-1">
        <ActionButton
          icon={X}
          label="Cerrar"
          onClick={onClose}
          variant="secondary"
          fullWidth={false}
        />
      </div>
    </div>
  );
};

AuditLogDetail.propTypes = {
  log: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
    source: PropTypes.string,
    transaction_id: PropTypes.string,
    table_name: PropTypes.string,
    record_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    action: PropTypes.string,
    old_data: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]),
    new_data: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]),
    ip_address: PropTypes.string,
    user_agent: PropTypes.string,
    is_succesfull: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error_message: PropTypes.string,
    created_at: PropTypes.string,
  }),
  onClose: PropTypes.func,
};
