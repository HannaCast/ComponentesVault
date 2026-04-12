import { useCallback, useState } from 'react';
import { verifyAccount as verifyAccountApi } from '../api/authApi';

const verificationCache = new Map();

const resolveSuccessResult = (response) => ({
  success: true,
  status: 'success',
  message: response?.data?.message || 'Tu cuenta fue verificada correctamente.',
});

const resolveErrorResult = (requestError) => {
  const backendMessage = requestError?.response?.data?.message;

  return {
    success: false,
    status: 'error',
    message: backendMessage || 'No se pudo verificar la cuenta.',
  };
};

export const useVerifyAccount = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const verifyToken = useCallback(async (token) => {
    if (!token) {
      setStatus('error');
      setMessage('No se encontró el código de verificación en la URL.');
      return { success: false };
    }

    const cachedEntry = verificationCache.get(token);
    if (cachedEntry) {
      if (cachedEntry.status === 'resolved') {
        const cachedResult = cachedEntry.result;
        setStatus(cachedResult.status);
        setMessage(cachedResult.message);
        return { success: cachedResult.success };
      }

      setStatus('loading');
      setMessage('');

      const pendingResult = await cachedEntry.promise;
      setStatus(pendingResult.status);
      setMessage(pendingResult.message);
      return { success: pendingResult.success };
    }

    setStatus('loading');
    setMessage('');

    const verificationPromise = verifyAccountApi(token)
      .then(resolveSuccessResult)
      .catch(resolveErrorResult)
      .then((result) => {
        verificationCache.set(token, {
          status: 'resolved',
          result,
        });
        return result;
      });

    verificationCache.set(token, {
      status: 'pending',
      promise: verificationPromise,
    });

    const result = await verificationPromise;
    setStatus(result.status);
    setMessage(result.message);
    return { success: result.success };
  }, []);

  return {
    status,
    message,
    verifyToken,
  };
};
