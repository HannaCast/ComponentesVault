import React from 'react';
import PropTypes from 'prop-types';
import { GraduationCap, Pencil } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';

const DAY_SHORT = {
  1: 'L',
  2: 'Ma',
  3: 'Mi',
  4: 'J',
  5: 'V',
  6: 'S',
  7: 'D',
};

const formatTimeShort = (value) => {
  if (value == null || value === '') {
    return '—';
  }
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
};

const formatAllowedDays = (allowedDays) => {
  if (!Array.isArray(allowedDays) || !allowedDays.length) {
    return '—';
  }
  return [...allowedDays]
    .sort((a, b) => a - b)
    .map((d) => DAY_SHORT[d] || d)
    .join(', ');
};

export const UniversityDetail = ({
  profile,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingStatePanel message="Cargando información..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-sm text-[var(--text-secondary)]">No se encontró la universidad.</p>
        <div className="flex gap-3 pt-6 border-t border-[var(--border-default)] mt-6">
          <ActionButton label="Cerrar" onClick={onClose} className="flex-1" />
        </div>
      </div>
    );
  }

  const usesGroups = Number(profile.uses_period_groups) === 1;
  const modalities = Array.isArray(profile.modalities) ? profile.modalities : [];
  const shifts = Array.isArray(profile.shifts) ? profile.shifts : [];
  const periods = Array.isArray(profile.academic_periods) ? profile.academic_periods : [];
  const activePeriod = profile.active_period;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)]">
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{
            backgroundColor: 'var(--accent-subtle, #dbeafe)',
            color: 'var(--accent, #2563eb)',
          }}
        >
          <GraduationCap size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)] break-words">
            {profile.name || '—'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {profile.short_name || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Código institucional
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              {profile.institution_code?.trim() || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Horario
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              {formatTimeShort(profile.start_time)}
              {' '}
              –
              {' '}
              {formatTimeShort(profile.end_time)}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Tipo de periodo
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              {profile.period_type_name || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Gestión de periodos
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                usesGroups
                  ? 'bg-green-100 text-green-800'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]'
              }`}
            >
              {usesGroups ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>
      </div>

      {usesGroups && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
            Periodo activo
          </p>
          {activePeriod ? (
            <div>
              <p className="text-base font-semibold text-[var(--accent,#2563eb)]">
                {activePeriod.name || '—'}
              </p>
              {activePeriod.display_range && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {activePeriod.display_range}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Sin periodo activo</p>
          )}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Modalidades de estudio
          {' '}
          ·
          {' '}
          {modalities.length}
        </p>
        <div className="space-y-3">
          {modalities.map((m) => {
            const cfg = m.configurations || {};
            const cdpw = cfg.classroom_days_per_week;
            const days = formatAllowedDays(cfg.allowed_days);

            return (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
              >
                <p className="font-semibold text-[var(--text-primary)]">{m.name || '—'}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {cdpw != null ? `${cdpw} días con salón` : '—'}
                </p>
                <p className="text-sm text-[var(--text-primary)] mt-2">{days}</p>
              </div>
            );
          })}
        </div>
        {!modalities.length && (
          <p className="text-sm text-[var(--text-secondary)]">Sin modalidades registradas.</p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Turnos disponibles
          {' '}
          ·
          {' '}
          {shifts.length}
        </p>
        <div className="space-y-2">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">{s.name}</span>
              <span className="text-sm text-[var(--text-secondary)]">
                {formatTimeShort(s.start_time)}
                {' '}
                –
                {' '}
                {formatTimeShort(s.end_time)}
              </span>
            </div>
          ))}
        </div>
        {!shifts.length && (
          <p className="text-sm text-[var(--text-secondary)]">Sin turnos configurados.</p>
        )}
      </div>

      {usesGroups && (
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Periodos académicos
            {' '}
            ·
            {' '}
            {periods.length}
          </p>
          <div className="space-y-2">
            {periods.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {p.name || '—'}
                  </span>
                  {Number(p.is_active) === 1 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  )}
                </div>
                {p.display_range && (
                  <span className="text-sm text-[var(--text-secondary)]">{p.display_range}</span>
                )}
              </div>
            ))}
          </div>
          {!periods.length && (
            <p className="text-sm text-[var(--text-secondary)]">Sin periodos registrados.</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton
          label="Cerrar"
          onClick={onClose}
          variant="secondary"
          className="flex-1"
        />
        <ActionButton
          label="Editar universidad"
          variant="primary"
          icon={Pencil}
          onClick={onEdit}
          className="flex-1"
        />
      </div>
    </div>
  );
};

UniversityDetail.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    short_name: PropTypes.string,
    institution_code: PropTypes.string,
    start_time: PropTypes.string,
    end_time: PropTypes.string,
    period_type_name: PropTypes.string,
    uses_period_groups: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    modalities: PropTypes.array,
    shifts: PropTypes.array,
    academic_periods: PropTypes.array,
    active_period: PropTypes.object,
  }),
  isLoading: PropTypes.bool,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
};
