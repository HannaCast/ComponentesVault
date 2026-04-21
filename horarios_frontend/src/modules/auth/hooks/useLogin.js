import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const loginUser = async (email, password) => {
    setError('');
    setLoading(true);
    const fallbackMessage = 'No se pudo iniciar sesion. Intenta nuevamente.';

    try {
      const userData = await login(email, password);
      if (!userData) {
        setError(fallbackMessage);
        return { success: false };
      }

      const redirectTo = userData.role === 'admin' ? '/admin' : '/usuario';
      navigate(redirectTo);
      return { success: true, data: userData };
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message
        || error?.response?.data?.detail
        || error?.message;
      setError(backendMessage || fallbackMessage);

      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    loginUser,
  };
};
