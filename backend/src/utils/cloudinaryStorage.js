import { v2 as cloudinary } from 'cloudinary';

// Configuração única — chamada no primeiro import.
// Credenciais nunca logadas (apenas validadas na inicialização do processo).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function validateCloudinaryConfig() {
  const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Variáveis Cloudinary ausentes: ${missing.join(', ')}`);
  }
}

// Retry com backoff exponencial para chamadas à API externa.
async function withRetry(fn, attempts = 3, baseMs = 600) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, baseMs * 2 ** i));
      }
    }
  }
  throw lastErr;
}

// Envia o buffer para o Cloudinary como recurso RAW autenticado.
// type: 'authenticated' exige URL assinada para qualquer acesso — nunca público.
// public_id inclui prefixo de pasta para organização no painel Cloudinary.
export function uploadContractFile(buffer, publicId) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            type: 'authenticated',
            public_id: publicId,
          },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(buffer);
      }),
    3
  );
}

// Gera uma URL assinada de curta duração para download privado.
// expires_at: timestamp Unix; após expirar, a URL retorna 401.
// A URL assinada nunca é armazenada no banco — é gerada sob demanda.
export function getSignedDownloadUrl(publicId, expiresInSeconds = 300) {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    secure: true,
  });
}

// Remove o recurso do Cloudinary (usado internamente, não exposto como endpoint).
export function deleteCloudinaryFile(publicId) {
  return withRetry(
    () => cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated' }),
    3
  );
}
