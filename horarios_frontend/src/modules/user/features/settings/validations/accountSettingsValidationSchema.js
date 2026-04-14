import * as Yup from 'yup';

export const evaluatePasswordRequirements = ({ newPassword = '' }) => {
  return {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(newPassword),
  };
};

export const arePasswordRequirementsMet = (requirements = {}) =>
  Object.values(requirements).every(Boolean);

export const changePasswordValidationSchema = Yup.object({
  oldPassword: Yup.string().required('La contraseña actual es obligatoria'),
  newPassword: Yup.string().required('La nueva contraseña es obligatoria'),
  confirmNewPassword: Yup.string()
    .required('Debes confirmar la nueva contraseña')
    .oneOf([Yup.ref('newPassword')], 'La confirmación no coincide con la nueva contraseña'),
});
