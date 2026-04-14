import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const backendDir = path.join(rootDir, 'horarios_backend');
const keysDir = path.join(backendDir, 'keys');

const privateKeyPath = path.join(keysDir, 'private_key.pem');
const publicKeyPath = path.join(keysDir, 'public_key.pem');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

ensureDir(keysDir);
fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
fs.writeFileSync(publicKeyPath, publicKey, 'utf8');

console.log(`[ok] Llave privada generada: ${privateKeyPath}`);
console.log(`[ok] Llave publica generada: ${publicKeyPath}`);

const publicKeyInline = `"${publicKey.trim().split('\n').join('\\n')}"`;

console.log('');
console.log('Pega manualmente estos valores en tus .env:');
console.log('');
console.log('Backend (horarios_backend/.env):');
console.log('RSA_PRIVATE_KEY=');
console.log('RSA_PRIVATE_KEY_PATH=keys/private_key.pem');
console.log('');
console.log('Frontend (horarios_frontend/.env):');
console.log(`VITE_RSA_PUBLIC_KEY=${publicKeyInline}`);
console.log('');
console.log('[done] Llaves generadas. Reinicia backend y frontend despues de guardar los .env.');
