import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { Calendar, Plus, Upload, X } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { Select } from '@shared/components/inputs/Select';
import { Switch } from '@shared/components/inputs/Switch';
import {
  buildFullUniversityPayload,
  createDefaultFormState,
  profileToFormState,
} from '../utils/universityPayloadUtils';
import {
  universityValidationSchema,
  validateUniversityCrossRules,
} from '../validations/universityValidationSchema';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

const WEEKDAYS = [
  { day: 1, label: 'L' },
  { day: 2, label: 'Ma' },
  { day: 3, label: 'Mi' },
  { day: 4, label: 'J' },
  { day: 5, label: 'V' },
  { day: 6, label: 'S' },
  { day: 7, label: 'D' },
];

const TABS = [
  { id: 'general', label: 'Datos generales' },
  { id: 'modalities', label: 'Modalidades' },
  { id: 'shifts', label: 'Turnos' },
  { id: 'periods', label: 'Periodos académicos' },
];

let universityFormUidSequence = 0;

const uid = () => {
  universityFormUidSequence += 1;
  return `${Date.now()}-${universityFormUidSequence.toString(36)}`;
};

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const getFirstErrorTab = (errs) => {
  const keys = Object.keys(errs);
  if (!keys.length) {
    return 'general';
  }
  const generalFields = new Set([
    'name',
    'short_name',
    'institution_code',
    'start_time',
    'end_time',
    'period_type',
  ]);
  if (keys.some((k) => generalFields.has(k))) {
    return 'general';
  }
  if (keys.some((k) => k.startsWith('modalities') || k.startsWith('modality_'))) {
    return 'modalities';
  }
  if (keys.some((k) => k.startsWith('shifts') || k.startsWith('shift_'))) {
    return 'shifts';
  }
  if (keys.some((k) => k.startsWith('academic_periods') || k.startsWith('period_') || k.startsWith('periods_'))) {
    return 'periods';
  }
  return 'general';
};

export const UniversityForm = ({
  periodTypeOptions = [],
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create',
  initialProfile = null,
}) => {
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && initialProfile) {
      return profileToFormState(initialProfile, periodTypeOptions);
    }
    return createDefaultFormState(periodTypeOptions);
  });
  const [activeTab, setActiveTab] = useState('general');
  const [formErrors, setFormErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    if (formData.uses_period_groups) {
      return;
    }
    setFormData((prev) => {
      if (!prev.academic_periods.length) {
        return prev;
      }
      return { ...prev, academic_periods: [] };
    });
    setActiveTab((t) => (t === 'periods' ? 'general' : t));
  }, [formData.uses_period_groups]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      return { ...prev, [field]: '' };
    });
  };

  const toggleModalityDay = (modalityIndex, day) => {
    setFormData((prev) => {
      const next = { ...prev };
      const row = next.modalities[modalityIndex];
      const setDays = new Set(row.allowed_days || []);
      if (setDays.has(day)) {
        setDays.delete(day);
      } else {
        setDays.add(day);
      }
      next.modalities = [...next.modalities];
      next.modalities[modalityIndex] = {
        ...row,
        allowed_days: [...setDays].sort((a, b) => a - b),
      };
      return next;
    });
  };

  const updateModality = (index, patch) => {
    setFormData((prev) => {
      const next = [...prev.modalities];
      next[index] = { ...next[index], ...patch };
      return { ...prev, modalities: next };
    });
  };

  const addModality = () => {
    setFormData((prev) => ({
      ...prev,
      modalities: [
        ...prev.modalities,
        {
          key: `m-${uid()}`,
          name: '',
          classroom_days_per_week: 0,
          allowed_days: [1],
        },
      ],
    }));
  };

  const removeModality = (index) => {
    setFormData((prev) => {
      if (prev.modalities.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        modalities: prev.modalities.filter((_, i) => i !== index),
      };
    });
  };

  const addShift = () => {
    setFormData((prev) => {
      const nextOrder = prev.shifts.length
        ? Math.max(...prev.shifts.map((s) => Number(s.order) || 0)) + 1
        : 1;
      return {
        ...prev,
        shifts: [
          ...prev.shifts,
          {
            key: `s-${uid()}`,
            name: '',
            start_time: prev.start_time || '08:00',
            end_time: '14:00',
            order: nextOrder,
          },
        ],
      };
    });
  };

  const updateShift = (index, patch) => {
    setFormData((prev) => {
      const next = [...prev.shifts];
      next[index] = { ...next[index], ...patch };
      return { ...prev, shifts: next };
    });
  };

  const removeShift = (index) => {
    setFormData((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== index),
    }));
  };

  const addPeriod = () => {
    setFormData((prev) => ({
      ...prev,
      academic_periods: [
        ...prev.academic_periods,
        {
          key: `p-${uid()}`,
          name: '',
          fecha_inicio: '',
          fecha_fin: '',
          order: prev.academic_periods.length + 1,
          is_active: prev.academic_periods.length === 0,
        },
      ],
    }));
  };

  const updatePeriod = (index, patch) => {
    setFormData((prev) => {
      const next = prev.academic_periods.map((p) => ({ ...p }));
      if (patch.is_active === true) {
        next.forEach((row, i) => {
          if (i !== index) {
            next[i] = { ...row, is_active: false };
          }
        });
      }
      next[index] = { ...next[index], ...patch };
      return { ...prev, academic_periods: next };
    });
  };

  const removePeriod = (index) => {
    setFormData((prev) => ({
      ...prev,
      academic_periods: prev.academic_periods.filter((_, i) => i !== index),
    }));
  };

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = '';
      return;
    }
    const contentType = String(file.type || '').toLowerCase().trim();
    if (!ALLOWED_LOGO_TYPES.has(contentType)) {
      toast.error('Tipo de archivo no permitido. Usa JPEG, PNG, GIF o WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('La imagen supera el tamaño máximo permitido (5 MB).');
      e.target.value = '';
      return;
    }
    setLogoPreviewUrl(URL.createObjectURL(file));
    setLogoFile(file);
    e.target.value = '';
  };

  const clearLogoSelection = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runValidation = async () => {
    try {
      await universityValidationSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const next = {};
      if (Array.isArray(err.inner) && err.inner.length) {
        err.inner.forEach((ve) => {
          const p = ve.path || '';
          if (!p) {
            return;
          }
          if (!next[p]) {
            next[p] = ve.message;
          }
          const modalityMatch = p.match(/^modalities\[(\d+)\]/);
          if (modalityMatch && !next[`modality_${modalityMatch[1]}_field`]) {
            next[`modality_${modalityMatch[1]}_field`] = ve.message;
          }
        });
      } else if (err?.path && err?.message) {
        next[err.path] = err.message;
      } else if (err?.message) {
        next._form = err.message;
      }
      setFormErrors(next);
      const merged = { ...next };
      const tab = getFirstErrorTab(merged);
      setActiveTab((prev) => (tab === 'periods' && !formData.uses_period_groups ? prev : tab));
      toast.error('Revisa los campos marcados. Te llevamos a la pestaña con el primer error.', {
        id: 'university-form-validation',
      });
      return false;
    }

    const cross = validateUniversityCrossRules(formData);
    if (Object.keys(cross).length > 0) {
      const merged = { ...cross };
      setFormErrors(merged);
      const tab = getFirstErrorTab(merged);
      setActiveTab((prev) => (tab === 'periods' && !formData.uses_period_groups ? prev : tab));
      toast.error('Hay inconsistencias en horarios, turnos o periodos. Revísalas antes de guardar.', {
        id: 'university-form-validation',
      });
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await runValidation())) {
      return;
    }

    const payload = buildFullUniversityPayload(formData, { isEdit: mode === 'edit' });
    onSubmit({ payload, logoFile });
  };

  const tabButtonClass = (tabId, disabled) => {
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

  const existingLogoSrc =
    mode === 'edit' && initialProfile?.image_url
      ? resolveMediaUrl(initialProfile.image_url)
      : null;
  const logoDisplaySrc = logoPreviewUrl || (!logoFile && existingLogoSrc) || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full pb-4 sm:pb-6">
      <div className="flex flex-wrap gap-3 sm:gap-4 border-b border-[var(--border-default)] overflow-x-auto pb-0.5 -mx-1 px-1">
        {TABS.map((tab) => {
          const disabled = tab.id === 'periods' && !formData.uses_period_groups;
          return (
            <button
              key={tab.id}
              type="button"
              className={tabButtonClass(tab.id, disabled)}
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
        <div className="space-y-4">
          <Input
            label="Nombre de la Universidad "
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Universidad Tecnológica de Emiliano Zapata"
            error={formErrors.name}
            disabled={isLoading}
            reserveHelperSpace={false}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Corto "
              value={formData.short_name}
              onChange={(e) => handleInputChange('short_name', e.target.value)}
              placeholder="UTEZ"
              error={formErrors.short_name}
              disabled={isLoading}
              reserveHelperSpace={false}
              required
            />
            <Input
              label="Código Institucional"
              value={formData.institution_code}
              onChange={(e) => handleInputChange('institution_code', e.target.value)}
              placeholder="UTEZ001"
              error={formErrors.institution_code}
              disabled={isLoading}
              reserveHelperSpace={false}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hora de Apertura "
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              error={formErrors.start_time}
              disabled={isLoading}
              reserveHelperSpace={false}
              required
            />
            <Input
              label="Hora de Cierre "
              type="time"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              disabled={isLoading}
              reserveHelperSpace={false}
              error={formErrors.end_time}
              required
            />
          </div>
          <Select
            label="Tipo de Periodo "
            options={periodTypeOptions}
            value={formData.period_type}
            onChange={(e) => handleInputChange('period_type', e.target.value)}
            placeholder="Selecciona un tipo de periodo"
            showPlaceholderOption
            disabled={isLoading || !periodTypeOptions.length}
            reserveHelperSpace={false}
            error={formErrors.period_type}
            required
          />

          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              backgroundColor: 'var(--accent-subtle, #eff6ff)',
              borderColor: 'var(--accent-muted, #bfdbfe)',
            }}
          >
            <Checkbox
              label="¿Gestionar periodos académicos?"
              checked={formData.uses_period_groups}
              onChange={(e) => handleInputChange('uses_period_groups', e.target.checked)}
              disabled={isLoading}
              helperText={
                'Si activas esta opción, los grupos estarán relacionados con periodos '
                + 'académicos específicos. Podrás configurarlos en la pestaña '
                + '"Periodos académicos".'
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Logo (archivo)"
                  value={logoFile ? logoFile.name : ''}
                  onChange={() => {}}
                  placeholder="Selecciona un archivo de imagen"
                  disabled={isLoading}
                  readOnly
                  reserveHelperSpace={false}
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {mode === 'edit'
                    ? 'Si eliges un archivo, reemplazará el logo actual al guardar.'
                    : 'Tras guardar, si eliges un archivo se subirá automáticamente como logo de la universidad.'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/"
                className="hidden"
                onChange={handleLogoPick}
              />
              <button
                type="button"
                className="mb-0.5 p-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface)]"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Seleccionar imagen"
              >
                <Upload className="w-5 h-5 text-[var(--accent,#2563eb)]" />
              </button>
            </div>
            {logoDisplaySrc ? (
              <div className="flex flex-wrap items-start gap-3">
                <div
                  className="rounded-xl border overflow-hidden bg-[var(--bg-surface,#fff)] p-2"
                  style={{ borderColor: 'var(--border-default,#e5e7eb)' }}
                >
                  <img
                    src={logoDisplaySrc}
                    alt="Vista previa del logo"
                    className="max-h-36 max-w-[min(100%,280px)] w-auto object-contain block mx-auto"
                  />
                </div>
                {logoFile ? (
                  <button
                    type="button"
                    onClick={clearLogoSelection}
                    disabled={isLoading}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-2 hover:underline"
                  >
                    Quitar imagen seleccionada
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === 'modalities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Modalidades de estudio
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Precargadas con valores por defecto. Edítalas según tu universidad o agrega nuevas.
              </p>
            </div>
            <ActionButton
              type="button"
              variant="primary"
              label="Nueva modalidad"
              icon={Plus}
              onClick={addModality}
              disabled={isLoading}
              fullWidth={false}
              className="sm:w-auto"
            />
          </div>

          {formData.modalities.map((m, idx) => (
            <div
              key={m.key || idx}
              className="rounded-xl border border-[var(--border-default)] p-4 space-y-3 relative bg-[var(--bg-surface,#f9fafb)]"
            >
              <button
                type="button"
                className="absolute top-3 right-3 text-[var(--error,#dc2626)] p-1"
                onClick={() => removeModality(idx)}
                disabled={isLoading || formData.modalities.length <= 1}
                aria-label="Eliminar modalidad"
              >
                <X className="w-5 h-5" />
              </button>
              <Input
                label="Nombre "
                value={m.name}
                onChange={(e) => updateModality(idx, { name: e.target.value })}
                error={formErrors[`modalities[${idx}].name`] || formErrors[`modality_${idx}_field`]}
                disabled={isLoading}
                reserveHelperSpace={false}
                required
              />
              <Input
                label="Días con salón por semana "
                type="number"
                min={0}
                max={7}
                value={m.classroom_days_per_week}
                onChange={(e) => updateModality(idx, { classroom_days_per_week: e.target.value })}
                error={formErrors[`modality_${idx}_cdpw`]}
                disabled={isLoading}
                reserveHelperSpace={false}
                required
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  <span>Días en que se estudía</span>
                  <span className="ml-1 text-[var(--error,#dc2626)]">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(({ day, label }) => {
                    const selected = (m.allowed_days || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isLoading}
                        onClick={() => toggleModalityDay(idx, day)}
                        className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          selected
                            ? 'bg-[var(--accent,#2563eb)] text-white border-[var(--accent,#2563eb)]'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs italic text-[var(--text-secondary)]">
                Modalidad por defecto: los días de estudio y salones son editables según tu universidad.
              </p>
            </div>
          ))}
          {formErrors.modalities && (
            <p className="text-sm text-[var(--error,#dc2626)]">{formErrors.modalities}</p>
          )}
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Turnos de la Universidad
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {`Define los turnos disponibles. Las horas deben estar dentro del horario de apertura (${formData.start_time || '—'}) y cierre (${formData.end_time || '—'}).`}
              </p>
            </div>
            <ActionButton
              type="button"
              variant="primary"
              label="Agregar Turno"
              icon={Plus}
              onClick={addShift}
              disabled={isLoading}
              fullWidth={false}
              className="sm:w-auto"
            />
          </div>

          {formData.shifts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 py-12 px-4 rounded-xl border-2 border-dashed border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              <Calendar className="w-10 h-10 opacity-50" />
              <p className="font-medium text-[var(--text-primary)]">No hay turnos configurados</p>
              <p className="text-sm">Agrega un turno para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.shifts.map((s, idx) => (
                <div key={s.key || idx} className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                    <div className="min-w-0 flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface,#f9fafb)] p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                        <div className="lg:col-span-3">
                          <Input
                            label="Nombre "
                            value={s.name}
                            onChange={(e) => updateShift(idx, { name: e.target.value })}
                            placeholder="Matutino"
                            disabled={isLoading}
                            reserveHelperSpace={false}
                            required
                          />
                        </div>
                        <div className="lg:col-span-3">
                          <Input
                            label="Hora Inicio "
                            type="time"
                            value={s.start_time}
                            onChange={(e) => updateShift(idx, { start_time: e.target.value })}
                            disabled={isLoading}
                            reserveHelperSpace={false}
                            required
                          />
                        </div>
                        <div className="lg:col-span-3">
                          <Input
                            label="Hora Fin "
                            type="time"
                            value={s.end_time}
                            onChange={(e) => updateShift(idx, { end_time: e.target.value })}
                            disabled={isLoading}
                            reserveHelperSpace={false}
                            required
                          />
                        </div>
                        <div className="lg:col-span-3">
                          <Input
                            label="Orden "
                            type="number"
                            min={1}
                            value={s.order}
                            onChange={(e) => updateShift(idx, { order: e.target.value })}
                            disabled={isLoading}
                            reserveHelperSpace={false}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="self-end sm:self-auto shrink-0 rounded-lg p-2.5 text-[var(--error,#dc2626)] border border-transparent hover:bg-red-50 hover:border-red-100 sm:mb-1"
                      onClick={() => removeShift(idx)}
                      disabled={isLoading}
                      aria-label="Eliminar turno"
                    >
                      <X className="w-5 h-5" strokeWidth={2.25} />
                    </button>
                  </div>
                  {(formErrors[`shift_${idx}_range`] || formErrors[`shift_${idx}_order`]) && (
                    <p className="text-sm text-[var(--error,#dc2626)] pl-0 sm:pl-1">
                      {formErrors[`shift_${idx}_range`] || formErrors[`shift_${idx}_order`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'periods' && formData.uses_period_groups && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Periodos académicos
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Define los periodos académicos. Solo un periodo puede estar activo a la vez.
              </p>
            </div>
            <ActionButton
              type="button"
              variant="primary"
              label="Nuevo periodo"
              icon={Plus}
              onClick={addPeriod}
              disabled={isLoading}
              fullWidth={false}
              className="sm:w-auto"
            />
          </div>

          {formErrors.academic_periods && (
            <p className="text-sm text-[var(--error,#dc2626)]">{formErrors.academic_periods}</p>
          )}
          {formErrors.periods_active && (
            <p className="text-sm text-[var(--error,#dc2626)]">{formErrors.periods_active}</p>
          )}

          {formData.academic_periods.map((p, idx) => (
            <div
              key={p.key || idx}
              className="rounded-xl border border-[var(--border-default)] p-4 space-y-3 bg-[var(--bg-surface,#f9fafb)]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Periodo Activo</span>
                <Switch
                  checked={Boolean(p.is_active)}
                  onCheckedChange={(v) => updatePeriod(idx, { is_active: v })}
                />
                {p.is_active && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                )}
              </div>
              <Input
                label="Nombre del Periodo "
                value={p.name}
                onChange={(e) => updatePeriod(idx, { name: e.target.value })}
                placeholder="Cuatrimestre Mayo-Agosto"
                disabled={isLoading}
                reserveHelperSpace={false}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha Inicio "
                  type="date"
                  value={p.fecha_inicio}
                  onChange={(e) => updatePeriod(idx, { fecha_inicio: e.target.value })}
                  disabled={isLoading}
                  reserveHelperSpace={false}
                  required
                />
                <Input
                  label="Fecha Fin "
                  type="date"
                  value={p.fecha_fin}
                  onChange={(e) => updatePeriod(idx, { fecha_fin: e.target.value })}
                  disabled={isLoading}
                  reserveHelperSpace={false}
                  required
                />
              </div>
              {(formErrors[`period_${idx}_date`]
                || formErrors[`period_${idx}_range`]
                || formErrors[`period_${idx}_year`]) && (
                <p className="text-sm text-[var(--error,#dc2626)]">
                  {formErrors[`period_${idx}_date`]
                    || formErrors[`period_${idx}_range`]
                    || formErrors[`period_${idx}_year`]}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[var(--error,#dc2626)] text-sm font-medium"
                  onClick={() => removePeriod(idx)}
                  disabled={isLoading}
                >
                  Eliminar periodo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-8 mt-2 border-t border-[var(--border-default)]">
        <ActionButton
          label="Cancelar"
          onClick={onCancel}
          disabled={isLoading}
          variant="secondary"
          className="flex-1 w-full sm:w-auto"
        />
        <ActionButton
          label={mode === 'edit' ? 'Actualizar' : 'Guardar'}
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          variant="primary"
          className="flex-1 w-full sm:w-auto"
        />
      </div>
    </form>
  );
};

UniversityForm.propTypes = {
  periodTypeOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
  })),
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  initialProfile: PropTypes.object,
};
