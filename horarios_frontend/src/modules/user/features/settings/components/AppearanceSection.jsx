import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Palette } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', description: 'Fondo general de la interfaz' },
  { value: 'dark', label: 'Oscuro', description: 'Ideal para ambientes con poca luz' },
  { value: 'system', label: 'Sistema', description: 'Usa la configuración del dispositivo' },
];

const ACCENT_OPTIONS = [
  { value: 'blue', hex: '#2563eb' },
  { value: 'purple', hex: '#7c3aed' },
  { value: 'teal', hex: '#0f766e' },
  { value: 'orange', hex: '#ea580c' },
  { value: 'pink', hex: '#d9467a' },
  { value: 'amber', hex: '#c47a1c' },
  { value: 'green', hex: '#3a7f1a' },
  { value: 'gray', hex: '#4b5563' },
];

const normalizeTheme = (theme) => {
  const allowedThemes = new Set(['light', 'dark', 'system']);
  return allowedThemes.has(theme) ? theme : 'light';
};

const normalizeAccent = (accent) => {
  const hasAccent = ACCENT_OPTIONS.some((item) => item.value === accent);
  return hasAccent ? accent : 'blue';
};

const getPreviewStyles = (theme) => {
  if (theme === 'dark') {
    return {
      background: '#1f2937',
      border: '#374151',
      text: '#e5e7eb',
      textMuted: '#9ca3af',
      surface: '#111827',
    };
  }

  if (theme === 'system') {
    return {
      background: 'linear-gradient(135deg, #f3f4f6 50%, #111827 50%)',
      border: '#9ca3af',
      text: '#111827',
      textMuted: '#4b5563',
      surface: '#ffffff',
    };
  }

  return {
    background: '#f8fafc',
    border: '#d1d5db',
    text: '#111827',
    textMuted: '#6b7280',
    surface: '#ffffff',
  };
};

export const AppearanceSection = ({
  initialTheme = 'light',
  initialAccent = 'blue',
  onSave,
}) => {
  const [themeDraft, setThemeDraft] = useState(normalizeTheme(initialTheme));
  const [accentDraft, setAccentDraft] = useState(normalizeAccent(initialAccent));
  const [savedTheme, setSavedTheme] = useState(normalizeTheme(initialTheme));
  const [savedAccent, setSavedAccent] = useState(normalizeAccent(initialAccent));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const normalizedTheme = normalizeTheme(initialTheme);
    const normalizedAccent = normalizeAccent(initialAccent);

    setThemeDraft(normalizedTheme);
    setAccentDraft(normalizedAccent);
    setSavedTheme(normalizedTheme);
    setSavedAccent(normalizedAccent);
  }, [initialTheme, initialAccent]);

  const hasPendingChanges = themeDraft !== savedTheme || accentDraft !== savedAccent;

  const selectedAccentHex = useMemo(() => {
    return ACCENT_OPTIONS.find((item) => item.value === accentDraft)?.hex || '#2563eb';
  }, [accentDraft]);

  const previewStyles = useMemo(() => getPreviewStyles(themeDraft), [themeDraft]);

  const handleSaveClick = async () => {
    if (!hasPendingChanges || saving) {
      return;
    }

    setSaving(true);
    try {
      await onSave?.({ theme: themeDraft, accent: accentDraft });
      setSavedTheme(themeDraft);
      setSavedAccent(accentDraft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SurfacePanel className="space-y-5">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5" style={{ color: 'var(--text-secondary, #6b7280)' }} />
        <h3 className="text-2xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
          Apariencia
        </h3>
      </div>

      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
          Tema de luz
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Fondo general de la interfaz
        </p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const isSelected = themeDraft === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setThemeDraft(option.value)}
                className="p-3 rounded-lg border text-left transition-colors"
                style={{
                  borderColor: isSelected ? 'var(--accent, #2563eb)' : 'var(--border-default, #d1d5db)',
                  backgroundColor: isSelected ? 'var(--accent-subtle, #eff6ff)' : 'var(--bg-surface, #f3f4f6)',
                }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
                  {option.label}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
          Color de acento
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Botones, íconos activos y elementos destacados
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {ACCENT_OPTIONS.map((accent) => {
            const isSelected = accentDraft === accent.value;

            return (
              <button
                key={accent.value}
                type="button"
                onClick={() => setAccentDraft(accent.value)}
                className="h-8 w-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: accent.hex,
                  borderColor: isSelected ? 'var(--text-primary, #111827)' : 'transparent',
                  boxShadow: isSelected ? '0 0 0 2px var(--bg-elevated, #ffffff)' : 'none',
                }}
                aria-label={`Seleccionar acento ${accent.value}`}
                title={accent.value}
              />
            );
          })}
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{
          borderColor: previewStyles.border,
          background: previewStyles.background,
        }}
      >
        <p className="text-sm font-medium" style={{ color: previewStyles.textMuted }}>
          Vista previa
        </p>

        <div
          className="mt-2 rounded-lg border p-3 flex items-center justify-between"
          style={{
            borderColor: previewStyles.border,
            backgroundColor: previewStyles.surface,
          }}
        >
          <span className="text-sm" style={{ color: previewStyles.text }}>
            Botón de acción principal
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: selectedAccentHex,
              color: '#ffffff',
            }}
          >
            Activo
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full sm:w-auto sm:min-w-40">
          <ActionButton
            label="Guardar"
            variant="primary"
            fullWidth={true}
            loading={saving}
            loadingLabel="Guardando..."
            disabled={!hasPendingChanges || saving}
            onClick={handleSaveClick}
          />
        </div>
      </div>
    </SurfacePanel>
  );
};

AppearanceSection.propTypes = {
  initialTheme: PropTypes.string,
  initialAccent: PropTypes.string,
  onSave: PropTypes.func,
};
