import { useState } from 'react';
import { register as registerApi } from '../api/authApi';

const normalizeFieldError = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

const mapBackendFieldErrors = (backendErrors) => {
  if (!backendErrors || typeof backendErrors !== 'object') {
    return {};
  }

  return {
    name: normalizeFieldError(backendErrors.name),
    surname: normalizeFieldError(backendErrors.surname),
    lastName: normalizeFieldError(backendErrors.last_name),
    email: normalizeFieldError(backendErrors.email),
    password: normalizeFieldError(backendErrors.password),
    confirmPassword: normalizeFieldError(backendErrors.confirmPassword),
  };
};

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const registerUser = async (formData) => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        surname: formData.surname,
        last_name: formData.lastName || null,
        email: formData.email,
        password: formData.password,
      };

      const response = await registerApi(payload);
      return {
        success: true,
        message: response?.data?.message || 'Cuenta creada exitosamente',
        data: response?.data?.data || null,
        fieldErrors: {},
      };
    } catch (requestError) {
      const backendMessage = requestError?.response?.data?.message;
      const backendFieldErrors = requestError?.response?.data?.data;
      const message = backendMessage || 'No se pudo crear la cuenta. Intenta nuevamente.';
      setError(message);

      return {
        success: false,
        message,
        data: null,
        fieldErrors: mapBackendFieldErrors(backendFieldErrors),
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    registerUser,
  };
};
