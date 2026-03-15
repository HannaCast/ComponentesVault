import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../core/context/AppContext';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const loginUser = async (email, password) => {
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (!userData) {
        setError('Correo o contraseña incorrectos');
        return { success: false };
      }

      const redirectTo = userData.role === 'admin' ? '/admin' : '/user';
      navigate(redirectTo);
      return { success: true, data: userData };
    } catch {
      setError('No se pudo iniciar sesión. Intenta nuevamente.');
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
