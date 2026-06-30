import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// IV de 96 bits (12 bytes) — padrão NIST SP 800-38D para GCM; qualquer outro
// tamanho força uma GHASH extra no OpenSSL e foge do uso canônico.
const IV_BYTES = 12;

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY deve ter 32 bytes (64 caracteres hex).');
  }
  return Buffer.from(hex, 'hex');
}

// Formato em repouso: ivHex:authTagHex:ciphertextHex
// Todos os segmentos são hex puro (0-9 a-f), portanto ':' nunca aparece no payload.
export function encrypt(text) {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);            // único por cifragem, jamais reutilizado
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();             // 16 bytes (128 bits) — padrão GCM
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(combined) {
  const key = getKey();
  const parts = combined.split(':');
  if (parts.length !== 3) throw new Error('Dado criptografado inválido.');
  const [ivHex, tagHex, encHex] = parts;
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  // final() lança DecipherAuthFailed se a authTag não bater — adulteração detectada.
  return decipher.update(Buffer.from(encHex, 'hex'), undefined, 'utf8') + decipher.final('utf8');
}
