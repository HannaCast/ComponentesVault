import { useCallback, useEffect, useState } from 'react';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import { changeMyPassword, getMyAccountInfo } from '../api/settingsApi';

const toFieldError = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]);
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

const mapBackendFieldErrors = (backendErrors = {}) => ({
  oldPassword: toFieldError(backendErrors.old_password),
  newPassword: toFieldError(backendErrors.new_password),
  confirmNewPassword: toFieldError(backendErrors.new_password_confirmation),
});

export const useAccountSettings = () => {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const { shouldRun: shouldRunProfileRequest } = useRequestDeduper({ windowMs: 150 });
  const { shouldRun: shouldRunPasswordRequest } = useRequestDeduper({ windowMs: 300 });

  const fetchProfile = useCallback(async () => {
    const requestSignature = buildRequestSignature(
      { resource: 'settings-profile', action: 'get-my-account-info' },
      ['resource', 'action']
    );

    if (!shouldRunProfileRequest(requestSignature)) {
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError(null);
      const response = await getMyAccountInfo();
      setProfile(response?.data?.data || null);
    } catch (error) {
      console.error('Error al obtener información de la cuenta:', error);
      setProfileError('No se pudo cargar la información personal.');
    } finally {
      setProfileLoading(false);
    }
  }, [shouldRunProfileRequest]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const changePassword = useCallback(async ({ oldPassword, newPassword, confirmNewPassword }) => {
    const requestSignature = buildRequestSignature(
      { resource: 'settings-password', action: 'change-password' },
      ['resource', 'action']
    );

    if (!shouldRunPasswordRequest(requestSignature)) {
      return {
        success: false,
        deduped: true,
        message: '',
        fieldErrors: {},
      };
    }

    try {
      setChangingPassword(true);

      await changeMyPassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirmation: confirmNewPassword,
      });

      return {
        success: true,
        deduped: false,
        message: 'Contraseña actualizada exitosamente. Inicia sesión nuevamente.',
        fieldErrors: {},
      };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);

      const responseData = error?.response?.data;
      const backendErrors = responseData?.data || {};
      const fieldErrors = mapBackendFieldErrors(backendErrors);

      return {
        success: false,
        deduped: false,
        message: responseData?.message || 'No se pudo actualizar la contraseña.',
        fieldErrors,
      };
    } finally {
      setChangingPassword(false);
    }
  }, [shouldRunPasswordRequest]);

  return {
    profile,
    profileLoading,
    profileError,
    changingPassword,
    fetchProfile,
    changePassword,
  };
};
