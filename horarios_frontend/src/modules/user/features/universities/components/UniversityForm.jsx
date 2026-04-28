import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { Select } from '@shared/components/inputs/Select';
import {
  universityValidationSchema,
  validateUniversityCrossRules,
} from '../validations/universityValidationSchema';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

import { ModalitiesTab } from './tabs/ModalitiesTab';
import { ShiftsTab } from './tabs/ShiftsTab';
import { PeriodsTab } from './tabs/PeriodsTab';

const TABS = [
  { id: 'general', label: 'Datos generales' },
  { id: 'modalities', label: 'Modalidades' },
  { id: 'shifts', label: 'Turnos' },
  { id: 'periods', label: 'Periodos académicos' },
];

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const resolveDefaultPeriodType = (periodTypeOptions = []) => {
  const firstOptionValue = periodTypeOptions[0]?.value;
  if (firstOptionValue == null) {
    return '';
  }
  return String(firstOptionValue);
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
      const formatTimeInput = (value) => {
        if (value == null || value === '') return '07:00';
        return String(value).slice(0, 5);
      };
      return {
        name: initialProfile.name || '',
        short_name: initialProfile.short_name || '',
        institution_code: initialProfile.institution_code || '',
        image_id: initialProfile.image || '',
        start_time: formatTimeInput(initialProfile.start_time),
        end_time: formatTimeInput(initialProfile.end_time),
        period_type: initialProfile.period_type || resolveDefaultPeriodType(periodTypeOptions),
        uses_period_groups: Number(initialProfile.uses_period_groups) === 1,
      };
    }
    return {
      name: '',
      short_name: '',
      institution_code: '',
      image_id: '',
      start_time: '07:00',
      end_time: '22:00',
      period_type: resolveDefaultPeriodType(periodTypeOptions),
      uses_period_groups: false,
    };
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [formErrors, setFormErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [isLogoDragActive, setIsLogoDragActive] = useState(false);
  const [removeExistingLogo, setRemoveExistingLogo] = useState(false);
  const fileInputRef = useRef(null);
  const hasExistingLogo = Boolean(mode === 'edit' && initialProfile?.image_url);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: '' };
    });
  };

  const validateLogoFile = (file) => {
    if (!(file instanceof File)) return 'Selecciona un archivo de imagen válido.';
    const contentType = String(file.type || '').toLowerCase().trim();
    if (!ALLOWED_LOGO_TYPES.has(contentType)) return 'Tipo de archivo no permitido. Usa JPEG, PNG, GIF o WebP.';
    if (file.size > MAX_LOGO_BYTES) return 'La imagen supera el tamaño máximo permitido (5 MB).';
    return null;
  };

  const applyLogoFile = (file) => {
    const validationError = validateLogoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl(URL.createObjectURL(file));
    setLogoFile(file);
  };

  const openLogoPicker = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (file) applyLogoFile(file);
    e.target.value = '';
  };

  const clearLogoSelection = () => {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const markCurrentLogoForRemoval = () => {
    if (isLoading || mode !== 'edit' || !hasExistingLogo) return;
    clearLogoSelection();
    setRemoveExistingLogo(true);
  };

  const restoreCurrentLogo = () => {
    if (isLoading || mode !== 'edit' || !hasExistingLogo) return;
    setRemoveExistingLogo(false);
  };

  const runValidation = async () => {
    try {
      await universityValidationSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const next = {};
      if (Array.isArray(err.inner) && err.inner.length) {
        err.inner.forEach((ve) => {
          if (ve.path) next[ve.path] = ve.message;
        });
      } else if (err?.path && err?.message) {
        next[err.path] = err.message;
      }
      setFormErrors(next);
      setActiveTab('general');
      toast.error('Revisa los campos marcados en la pestaña de datos generales.');
      return false;
    }

    const cross = validateUniversityCrossRules(formData);
    if (Object.keys(cross).length > 0) {
      setFormErrors(cross);
      setActiveTab('general');
      toast.error('Hay inconsistencias en los horarios. Revísalas antes de guardar.');
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!(await runValidation())) return;

    // Enviar solo el payload base (datos generales)
    const payload = {
      university: {
        name: formData.name.trim(),
        short_name: formData.short_name.trim(),
        institution_code: formData.institution_code?.trim() || null,
        start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
        end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time,
        period_type: Number(formData.period_type),
      }
    };

    if (mode === 'create') {
      payload.university.uses_period_groups = formData.uses_period_groups ? 1 : 0;
    }

    onSubmit({
      payload,
      logoFile,
      removeLogo: mode === 'edit' && removeExistingLogo,
    });
  };

  const tabButtonClass = (tabId, disabled) => {
    const active = activeTab === tabId;
    if (disabled) {
      return 'whitespace-nowrap pb-2 text-sm font-medium text-[var(--text-disabled,#94a3b8)] cursor-not-allowed hidden sm:block';
    }
    return `whitespace-nowrap pb-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'text-[var(--accent,#2563eb)] border-[var(--accent,#2563eb)]'
        : 'text-[var(--text-secondary,#6b7280)] border-transparent hover:text-[var(--text-primary)]'
    }`;
  };

  const resolvedExistingLogoSrc = mode === 'edit' && initialProfile?.image_url
    ? resolveMediaUrl(initialProfile.image_url) : null;
  const existingLogoSrc = removeExistingLogo ? null : resolvedExistingLogoSrc;
  const logoDisplaySrc = logoPreviewUrl || (!logoFile && existingLogoSrc) || null;
  const isPeriodGroupsLocked = mode === 'edit';

  // Mostrar tabs completas si edit, o solo 'general' si create
  const visibleTabs = mode === 'create' ? [TABS[0]] : TABS;

  return (
    <div className="space-y-6 w-full pb-4 sm:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-0.5 -mx-1 px-1">
        <div className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto min-w-0 pb-1">
          {visibleTabs.map((tab) => {
            const disabled = tab.id === 'periods' && !formData.uses_period_groups;
            if (disabled) return null;
            return (
              <button
                key={tab.id}
                type="button"
                className={tabButtonClass(tab.id, disabled)}
                disabled={disabled}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab === 'general' && (
          <div className="flex items-center gap-2 shrink-0">
            <ActionButton
              type="button"
              variant="primary"
              label="Guardar Datos Generales"
              onClick={handleSubmit}
              disabled={isLoading}
              fullWidth={false}
            />
          </div>
        )}
      </div>

      {activeTab === 'general' && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nombre de la Universidad"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Universidad Tecnológica de Emiliano Zapata"
            error={formErrors.name}
            disabled={isLoading}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Corto"
              value={formData.short_name}
              onChange={(e) => handleInputChange('short_name', e.target.value)}
              placeholder="UTEZ"
              error={formErrors.short_name}
              disabled={isLoading}
              required
            />
            <Input
              label="Código Institucional"
              value={formData.institution_code}
              onChange={(e) => handleInputChange('institution_code', e.target.value)}
              placeholder="UTEZ001"
              error={formErrors.institution_code}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hora de Apertura"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              error={formErrors.start_time}
              disabled={isLoading}
              required
            />
            <Input
              label="Hora de Cierre"
              type="time"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              error={formErrors.end_time}
              disabled={isLoading}
              required
            />
          </div>
          <Select
            label="Tipo de Periodo"
            options={periodTypeOptions}
            value={formData.period_type}
            onChange={(e) => handleInputChange('period_type', e.target.value)}
            placeholder="Selecciona un tipo de periodo"
            showPlaceholderOption
            disabled={isLoading || !periodTypeOptions.length}
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
              disabled={isLoading || isPeriodGroupsLocked}
              helperText={
                isPeriodGroupsLocked
                  ? 'Esta configuración se define al crear la universidad y no se puede modificar en edición.'
                  : 'Si activas esta opción, los grupos estarán relacionados con periodos académicos específicos.'
              }
            />
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Logo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleLogoPick}
            />
            {!logoDisplaySrc ? (
              <div
                role="button"
                tabIndex={isLoading ? -1 : 0}
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all ${
                  isLogoDragActive ? 'border-[var(--accent,#2563eb)] bg-[var(--accent-subtle,#eff6ff)]' : 'border-[var(--border-default,#d1d5db)] hover:bg-[var(--accent-subtle,#eff6ff)]/50'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={openLogoPicker}
                onDragOver={(e) => { e.preventDefault(); setIsLogoDragActive(true); }}
                onDragLeave={() => setIsLogoDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsLogoDragActive(false);
                  if (!isLoading && e.dataTransfer?.files?.[0]) applyLogoFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-[var(--border-default,#d1d5db)] bg-[var(--bg-elevated,#ffffff)] p-3">
                      <Upload className="w-5 h-5 text-[var(--accent,#2563eb)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Arrastra y suelta tu logo aquí</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">JPEG, PNG, GIF o WebP, máximo 5 MB.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-default,#e5e7eb)] bg-[var(--bg-elevated,#ffffff)] p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      {logoFile ? 'Vista previa' : 'Logo actual'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={openLogoPicker} disabled={isLoading} className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline">
                      Cambiar imagen
                    </button>
                    {mode === 'edit' && !logoFile && hasExistingLogo && (
                      <button type="button" onClick={markCurrentLogoForRemoval} disabled={isLoading} className="text-sm font-medium text-[var(--error,#dc2626)] hover:underline">
                        Quitar
                      </button>
                    )}
                    {logoFile && (
                      <button type="button" onClick={clearLogoSelection} disabled={isLoading} className="text-sm font-medium text-[var(--text-secondary)] hover:underline">
                        Quitar selección
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-center">
                  <div className="w-full max-w-[320px] rounded-xl border border-[var(--border-default,#e5e7eb)] bg-[var(--bg-surface,#f9fafb)] p-2 flex items-center justify-center min-h-[180px]">
                    <img src={logoDisplaySrc} alt="Logo" className="max-h-40 max-w-full w-auto object-contain" />
                  </div>
                </div>
              </div>
            )}
            {mode === 'edit' && removeExistingLogo && hasExistingLogo && (
              <div className="rounded-xl border border-dashed border-[var(--border-default,#d1d5db)] px-3 py-2 text-xs text-[var(--text-secondary)] flex justify-between">
                <span>El logo actual se quitará al guardar.</span>
                <button type="button" onClick={restoreCurrentLogo} disabled={isLoading} className="font-medium text-[var(--accent,#2563eb)] hover:underline">Restaurar</button>
              </div>
            )}
          </div>
        </form>
      )}

      {activeTab === 'modalities' && <ModalitiesTab />}
      {activeTab === 'shifts' && <ShiftsTab />}
      {activeTab === 'periods' && <PeriodsTab />}
    </div>
  );
};
