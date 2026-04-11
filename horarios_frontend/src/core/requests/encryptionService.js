const RSA_OAEP_HASH = "SHA-256";

// encryptionService.js — funciones para cifrar payloads con RSA-OAEP + AES-GCM
const toBase64 = (bufferOrBytes) => {
  const bytes = bufferOrBytes instanceof Uint8Array ? bufferOrBytes : new Uint8Array(bufferOrBytes);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCodePoint(...chunk);
  }

  return btoa(binary);
};

// Normaliza el PEM eliminando comillas, reemplazando \n y recortando espacios
const normalizePem = (value = "") => {
  const trimmedValue = value.trim();
  const unwrappedValue = trimmedValue.startsWith('"') && trimmedValue.endsWith('"')
    ? trimmedValue.slice(1, -1)
    : trimmedValue;

  return unwrappedValue.replaceAll(String.raw`\n`, '\n');
};

// Importa la clave pública RSA desde formato PEM a CryptoKey
const importRsaPublicKey = async (pemPublicKey) => {
  const normalizedPem = normalizePem(pemPublicKey);

  if (!normalizedPem.includes("-----BEGIN PUBLIC KEY-----") || !normalizedPem.includes("-----END PUBLIC KEY-----")) {
    throw new Error("VITE_RSA_PUBLIC_KEY no tiene formato PEM valido");
  }

  const pemBody = normalizedPem
    .replaceAll("-----BEGIN PUBLIC KEY-----", "")
    .replaceAll("-----END PUBLIC KEY-----", "")
    .replaceAll(/\s+/g, "");

  let der;
  try {
    der = Uint8Array.from(atob(pemBody), (char) => char.codePointAt(0) ?? 0);
  } catch {
    throw new Error("VITE_RSA_PUBLIC_KEY contiene datos base64 invalidos");
  }

  return crypto.subtle.importKey(
    "spki",
    der.buffer,
    {
      name: "RSA-OAEP",
      hash: RSA_OAEP_HASH,
    },
    false,
    ["encrypt"]
  );
};

// Verifica si la clave pública RSA está configurada en las variables de entorno
export const hasEncryptionKey = () => Boolean(import.meta.env.VITE_RSA_PUBLIC_KEY);

// Cifra el payload usando AES-GCM para los datos y RSA-OAEP para la clave AES
export const encryptPayload = async (payload) => {
  const pemPublicKey = import.meta.env.VITE_RSA_PUBLIC_KEY;

  if (!pemPublicKey) {
    throw new Error("VITE_RSA_PUBLIC_KEY no esta configurada");
  }

  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedPayload
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const rsaPublicKey = await importRsaPublicKey(pemPublicKey);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawAesKey
  );

  return {
    key: toBase64(encryptedKey),
    iv: toBase64(iv),
    data: toBase64(encryptedData),
  };
};
