import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/preferences
router.get('/', requireAuth, async (req, res) => {
  try {
    const prefs = await prisma.preferences.findUnique({ where: { userId: req.userId } });
    res.json(prefs || {});
  } catch {
    res.status(500).json({ error: 'Erro ao buscar preferências.' });
  }
});

// PUT /api/preferences
router.put(
  '/',
  requireAuth,
  [
    body('stackFavorita').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
    body('padroesCodigo').optional({ nullable: true }).isString().trim().isLength({ max: 4000 }),
    body('observacoesFixas').optional({ nullable: true }).isString().trim().isLength({ max: 4000 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { stackFavorita, padroesCodigo, observacoesFixas } = req.body;
      const prefs = await prisma.preferences.upsert({
        where: { userId: req.userId },
        update: {
          ...(stackFavorita !== undefined && { stackFavorita }),
          ...(padroesCodigo !== undefined && { padroesCodigo }),
          ...(observacoesFixas !== undefined && { observacoesFixas }),
        },
        create: {
          userId: req.userId,
          stackFavorita: stackFavorita ?? null,
          padroesCodigo: padroesCodigo ?? null,
          observacoesFixas: observacoesFixas ?? null,
        },
      });
      res.json(prefs);
    } catch {
      res.status(500).json({ error: 'Erro ao salvar preferências.' });
    }
  }
);

export default router;
