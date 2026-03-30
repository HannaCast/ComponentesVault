import { useCallback, useRef } from 'react';

// Normaliza un valor para su inclusión en la firma de la solicitud
const normalizeValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return String(value);
};

// Construye una firma única para una solicitud basada en los parámetros y las claves relevantes
export const buildRequestSignature = (params = {}, keys = []) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    return JSON.stringify(params);
  }

  return keys
    .map((key) => `${key}:${normalizeValue(params[key])}`)
    .join('|');
};

// Hook para deduplicar solicitudes basándose en una firma generada a partir de los parámetros
export const useRequestDeduper = ({ windowMs = 150 } = {}) => {
  const lastRequestRef = useRef({ key: '', ts: 0 });

  const shouldRun = useCallback((signature) => {
    const now = Date.now();

    if (
      lastRequestRef.current.key === signature
      && now - lastRequestRef.current.ts < windowMs
    ) {
      return false;
    }

    lastRequestRef.current = { key: signature, ts: now };
    return true;
  }, [windowMs]);

  return {
    shouldRun,
  };
};
