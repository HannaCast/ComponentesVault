import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Pencil } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { UniversityLogoMark } from './UniversityLogoMark';
import { ModalitiesTab } from './tabs/ModalitiesTab';
import { ShiftsTab } from './tabs/ShiftsTab';
import { PeriodsTab } from './tabs/PeriodsTab';

const DETAIL_TABS = [
  { id: 'general', label: 'Datos generales' },
  { id: 'modalities', label: 'Modalidades' },
  { id: 'shifts', label: 'Turnos' },
  { id: 'periods', label: 'Periodos académicos' },
];

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

const tabButtonClass = (activeTab, tabId, disabled) => {
  const active = activeTab === tabId;
  if (disabled) {
    return 'whitespace-nowrap pb-2 text-sm font-medium text-[var(--text-disabled,#94a3b8)] cursor-not-allowed';
  }
  return `whitespace-nowrap pb-2 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'text-[var(--accent,#2563eb)] border-[var(--accent,#2563eb)]'
      : 'text-[var(--text-secondary,#6b7280)] border-transparent hover:text-[var(--text-primary)]'
  }`;
};

export const UniversityDetail = ({
  profile,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    setActiveTab('general');
  }, [profile?.id]);

  if (isLoading) {
    return (
      <div className="py-2 sm:py-4">
        <LoadingStatePanel message="Cargando información..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-2 sm:py-4 space-y-6">
        <p className="text-sm text-[var(--text-secondary)]">No se encontró la universidad.</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-[var(--border-default)]">
          <ActionButton label="Cerrar" onClick={onClose} className="flex-1 w-full sm:w-auto" />
        </div>
      </div>
    );
  }

  const usesGroups = Number(profile.uses_period_groups) === 1;
  const modalities = Array.isArray(profile.modalities) ? profile.modalities : [];
  const shifts = Array.isArray(profile.shifts) ? profile.shifts : [];
  const periods = Array.isArray(profile.academic_periods) ? profile.academic_periods : [];
  const activePeriod = profile.active_period;

  const innerCard = 'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface,#f9fafb)] p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 sm:gap-4 border-b border-[var(--border-default)] overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
        {DETAIL_TABS.map((tab) => {
          const disabled = tab.id === 'periods' && !usesGroups;
          return (
            <button
              key={tab.id}
              type="button"
              className={tabButtonClass(activeTab, tab.id, disabled)}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setActiveTab(tab.id);
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-[var(--border-default)]">
            <UniversityLogoMark
              imageUrl={profile.image_url}
              name={profile.name}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[var(--text-tertiary)] mb-1">
                Logo institucional
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {profile.image_url
                  ? 'Esta imagen se muestra como identidad visual de la universidad.'
                  : 'Aún no hay logo. Puedes subir uno al editar la universidad.'}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
                Código institucional
              </dt>
              <dd className="text-sm text-[var(--text-primary)] break-words">
                {profile.institution_code?.trim() || '—'}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
                Tipo de periodo
              </dt>
              <dd className="text-sm text-[var(--text-primary)] break-words">
                {profile.period_type_name || '—'}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
                Horario
              </dt>
              <dd className="text-sm text-[var(--text-primary)] tabular-nums">
                {formatTimeShort(profile.start_time)}
                {' '}
                –
                {' '}
                {formatTimeShort(profile.end_time)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1">
                Gestión de periodos
              </dt>
              <dd>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usesGroups
                      ? 'bg-green-100 text-green-800'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                  }`}
                >
                  {usesGroups ? 'Activa' : 'Inactiva'}
                </span>
              </dd>
            </div>
          </dl>

          {usesGroups && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
                Periodo activo
              </p>
              {activePeriod ? (
                <div className={innerCard}>
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
        </div>
      )}

      {activeTab === 'modalities' && <ModalitiesTab readOnly />}
      {activeTab === 'shifts' && <ShiftsTab readOnly />}
      {activeTab === 'periods' && usesGroups && <PeriodsTab readOnly />}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton
          label="Cancelar"
          onClick={onClose}
          variant="secondary"
          className="flex-1 w-full sm:w-auto"
        />
        <ActionButton
          label="Editar universidad"
          variant="primary"
          icon={Pencil}
          onClick={onEdit}
          className="flex-1 w-full sm:w-auto"
        />
      </div>
    </div>
  );
};

UniversityDetail.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    image_url: PropTypes.string,
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
