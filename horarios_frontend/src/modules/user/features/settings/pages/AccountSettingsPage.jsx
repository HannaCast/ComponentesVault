import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@context/AuthContext';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { InfoFieldCard } from '@shared/components/layout/InfoFieldCard';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { AppearanceSection } from '../components/AppearanceSection';
import { PasswordRequirementsChecklist } from '../components/PasswordRequirementsChecklist';
import { useAccountSettings } from '../hooks/useAccountSettings';
import {
  arePasswordRequirementsMet,
  changePasswordValidationSchema,
  evaluatePasswordRequirements,
} from '../validations/accountSettingsValidationSchema';

const INITIAL_FORM_STATE = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

const mapYupErrors = (validationError) => {
  if (!validationError?.inner) {
    return {};
  }

  return validationError.inner.reduce((accumulator, currentError) => {
    if (currentError.path && !accumulator[currentError.path]) {
      accumulator[currentError.path] = currentError.message;
    }
    return accumulator;
  }, {});
};

const hasBasicFieldsCompleted = (formData) =>
  Boolean(formData.oldPassword && formData.newPassword && formData.confirmNewPassword);

export const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    profile,
    profileLoading,
    profileError,
    changingPassword,
    changePassword,
  } = useAccountSettings();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const requirements = useMemo(() => {
    return evaluatePasswordRequirements({
      newPassword: formData.newPassword,
    });
  }, [formData.newPassword]);

  const areRequirementsMet = arePasswordRequirementsMet(requirements);
  const doesConfirmationMatch =
    formData.confirmNewPassword.length > 0 && formData.confirmNewPassword === formData.newPassword;

  const isSubmitEnabled =
    hasBasicFieldsCompleted(formData)
    && areRequirementsMet
    && doesConfirmationMatch
    && !changingPassword;

  const displayName = profile?.name || user?.name || 'Usuario';
  const displayEmail = profile?.email || user?.email || 'No disponible';

  const handleFieldChange = (fieldName) => (event) => {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,
      [fieldName]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [fieldName]: null,
    }));
  };

  const validateForm = async () => {
    try {
      await changePasswordValidationSchema.validate(formData, { abortEarly: false });

      const fieldErrors = {};
      if (!areRequirementsMet) {
        fieldErrors.newPassword = 'La nueva contraseña aún no cumple todos los requisitos.';
      }

      setFormErrors(fieldErrors);
      return Object.keys(fieldErrors).length === 0;
    } catch (validationError) {
      const mappedErrors = mapYupErrors(validationError);
      if (!areRequirementsMet) {
        mappedErrors.newPassword = mappedErrors.newPassword
          || 'La nueva contraseña aún no cumple todos los requisitos.';
      }

      setFormErrors(mappedErrors);
      return false;
    }
  };

  const handleOpenConfirmModal = async (event) => {
    event.preventDefault();

    const isFormValid = await validateForm();
    if (!isFormValid) {
      toast.error('Completa correctamente los campos de contraseña.');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmPasswordChange = async () => {
    const result = await changePassword(formData);

    if (result?.deduped) {
      return;
    }

    if (!result.success) {
      setConfirmModalOpen(false);
      setFormErrors((previous) => ({
        ...previous,
        ...result.fieldErrors,
      }));
      toast.error(result.message);
      return;
    }

    setConfirmModalOpen(false);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});

    toast.success('Contraseña actualizada. Se cerrará tu sesión.');
    await logout();
    navigate('/login', { replace: true });
  };

  const handleAppearanceSave = async () => {
    toast('La persistencia de tema y acento estará disponible próximamente.');
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <PageSectionHeader
        title="Ajustes de Cuenta"
        contextLabel="Gestiona tu información personal y seguridad"
      />

      <SurfacePanel className="space-y-4">
        <div className="flex items-center gap-2">
          <UserRound className="w-5 h-5" style={{ color: 'var(--text-secondary, #6b7280)' }} />
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
            Información Personal
          </h3>
        </div>

        {profileError ? (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--warning-border, #fcd34d)',
              backgroundColor: 'var(--warning-subtle, #fffbeb)',
              color: 'var(--warning-text, #92400e)',
            }}
          >
            {profileError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoFieldCard
            icon={UserRound}
            label="Nombre completo"
            value={profileLoading ? 'Cargando...' : displayName}
          />

          <InfoFieldCard
            icon={Mail}
            label="Correo electrónico"
            value={profileLoading ? 'Cargando...' : displayEmail}
          />
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5" style={{ color: 'var(--text-secondary, #6b7280)' }} />
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
            Cambiar Contraseña
          </h3>
        </div>

        <form className="space-y-4" onSubmit={handleOpenConfirmModal}>
          <Input
            type="password"
            label="Contraseña Actual"
            value={formData.oldPassword}
            onChange={handleFieldChange('oldPassword')}
            placeholder="Ingresa tu contraseña actual"
            error={formErrors.oldPassword}
          />

          <Input
            type="password"
            label="Nueva Contraseña"
            value={formData.newPassword}
            onChange={handleFieldChange('newPassword')}
            placeholder="Ingresa tu nueva contraseña"
            error={formErrors.newPassword}
          />

          <PasswordRequirementsChecklist requirements={requirements} />

          <Input
            type="password"
            label="Confirmar Nueva Contraseña"
            value={formData.confirmNewPassword}
            onChange={handleFieldChange('confirmNewPassword')}
            placeholder="Confirma tu nueva contraseña"
            error={formErrors.confirmNewPassword}
          />

          <div className="pt-2">
            <ActionButton
              type="submit"
              label="Actualizar Contraseña"
              loading={changingPassword}
              loadingLabel="Actualizando..."
              disabled={!isSubmitEnabled}
              variant="primary"
              fullWidth={true}
            />
          </div>
        </form>
      </SurfacePanel>

      <AppearanceSection
        initialTheme={user?.theme}
        initialAccent={user?.accent}
        onSave={handleAppearanceSave}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmPasswordChange}
        title="Confirmar cambio de contraseña"
        message="¿Deseas actualizar tu contraseña ahora? Al confirmar, se cerrará tu sesión para que inicies con tu nueva contraseña."
        confirmLabel="Sí, cambiar contraseña"
      />
    </div>
  );
};
