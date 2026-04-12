import { useCallback, useState } from 'react';
import { verifyAccount as verifyAccountApi } from '../api/authApi';

export const useVerifyAccount = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const verifyToken = useCallback(async (token) => {
    if (!token) {
      setStatus('error');
      setMessage('No se encontró el código de verificación en la URL.');
      return { success: false };
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await verifyAccountApi(token);
      setStatus('success');
      setMessage(response?.data?.message || 'Tu cuenta fue verificada correctamente.');
      return { success: true };
    } catch (requestError) {
      const backendMessage = requestError?.response?.data?.message;
      setStatus('error');
      setMessage(backendMessage || 'No se pudo verificar la cuenta.');
      return { success: false };
    }
  }, []);

  return {
    status,
    message,
    verifyToken,
  };
};
