import { Router } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

const TIPOS_VALIDOS = ['desenvolvimento', 'licenca_manutencao', 'nda', 'outro'];

// GET /api/contract-templates
router.get('/', requireAuth, async (req, res) => {
  try {
    const templates = await prisma.contractTemplate.findMany({
      where: { userId: req.userId },
      select: { id: true, nome: true, tipo: true, campos: true, versao: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/contract-templates/:id
router.get(
  '/:id',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const template = await prisma.contractTemplate.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!template) return res.status(404).json({ error: 'Modelo não encontrado.' });
      res.json(template);
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// POST /api/contract-templates
router.post(
  '/',
  requireAuth,
  [
    body('nome').trim().notEmpty().isLength({ max: 200 }).withMessage('Nome obrigatório (máx. 200 chars).'),
    body('tipo').isIn(TIPOS_VALIDOS).withMessage('Tipo inválido.'),
    body('corpo').trim().notEmpty().isLength({ max: 100000 }).withMessage('Corpo obrigatório.'),
    body('campos').isArray().withMessage('Campos deve ser um array.'),
    body('campos.*.chave').trim().notEmpty().withMessage('Cada campo precisa de uma chave.'),
    body('campos.*.rotulo').trim().notEmpty().withMessage('Cada campo precisa de um rótulo.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { nome, tipo, corpo, campos } = req.body;
      const template = await prisma.contractTemplate.create({
        data: { userId: req.userId, nome, tipo, corpo, campos, versao: 1 },
      });
      res.status(201).json(template);
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// PUT /api/contract-templates/:id
router.put(
  '/:id',
  requireAuth,
  [
    param('id').notEmpty(),
    body('nome').optional().trim().notEmpty().isLength({ max: 200 }),
    body('tipo').optional().isIn(TIPOS_VALIDOS),
    body('corpo').optional().trim().notEmpty().isLength({ max: 100000 }),
    body('campos').optional().isArray(),
    body('campos.*.chave').optional().trim().notEmpty(),
    body('campos.*.rotulo').optional().trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const existing = await prisma.contractTemplate.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!existing) return res.status(404).json({ error: 'Modelo não encontrado.' });

      const { nome, tipo, corpo, campos } = req.body;
      const template = await prisma.contractTemplate.update({
        where: { id: req.params.id },
        data: {
          ...(nome !== undefined && { nome }),
          ...(tipo !== undefined && { tipo }),
          ...(corpo !== undefined && { corpo }),
          ...(campos !== undefined && { campos }),
          versao: { increment: 1 },
        },
      });
      res.json(template);
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// DELETE /api/contract-templates/:id
router.delete(
  '/:id',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const existing = await prisma.contractTemplate.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!existing) return res.status(404).json({ error: 'Modelo não encontrado.' });

      await prisma.contractTemplate.delete({ where: { id: req.params.id } });
      res.json({ message: 'Modelo excluído.' });
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

export default router;
