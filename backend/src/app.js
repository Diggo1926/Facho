import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { globalLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import phaseRoutes from './routes/phases.js';
import referenceRoutes from './routes/references.js';
import preferenceRoutes from './routes/preferences.js';
import templateRoutes from './routes/templates.js';
import contractTemplateRoutes from './routes/contractTemplates.js';
import { contractProjectRouter, contractRouter } from './routes/contracts.js';

console.log('Iniciando Facho backend...');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const app = express();
app.set('trust proxy', 1);

const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  console.error('FATAL: CORS_ORIGIN não definido. Encerrando.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  const dbUrl = process.env.DATABASE_URL || '';
  const hasSsl = dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true');
  if (!hasSsl) {
    console.warn('AVISO: DATABASE_URL não contém sslmode=require.');
    console.warn('       Adicione ?sslmode=require à URL no Railway para criptografar a conexão com o banco.');
  }
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: process.env.NODE_ENV === 'production',
  })
);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', contractProjectRouter);
app.use('/api/phases', phaseRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/contracts', contractRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err.stack?.split('\n')[0]);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Facho backend rodando na porta ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
