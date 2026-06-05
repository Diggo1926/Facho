import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/references
router.post(
  '/',
  requireAuth,
  [
    body('nome').trim().notEmpty().isLength({ max: 200 }).withMessage('Nome obrigatório (máx. 200 chars).'),
    body('categoria').trim().notEmpty().isIn(['design', 'seguranca', 'infraestrutura', 'codigo', 'prompts']).withMessage('Categoria inválida.'),
    body('link').optional({ nullable: true }).isURL().withMessage('Link inválido.'),
    body('subcategoria').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('anotacoes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    body('corFundo').optional({ nullable: true }).trim().matches(/^#[0-9A-Fa-f]{3,6}$/).withMessage('Cor inválida (use hex, ex: #7A4A3A).'),
  ],
  validate,
  async (req, res) => {
    try {
      const { nome, link, categoria, subcategoria, anotacoes, corFundo } = req.body;
      const reference = await prisma.reference.create({
        data: { userId: req.userId, nome, link, categoria, subcategoria, anotacoes, corFundo },
      });
      res.status(201).json(reference);
    } catch {
      res.status(500).json({ error: 'Erro ao criar referência.' });
    }
  }
);

// GET /api/references
router.get(
  '/',
  requireAuth,
  [query('categoria').optional().trim()],
  validate,
  async (req, res) => {
    try {
      const where = {
        userId: req.userId,
        ...(req.query.categoria && { categoria: req.query.categoria }),
      };
      const references = await prisma.reference.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      res.json(references);
    } catch {
      res.status(500).json({ error: 'Erro ao listar referências.' });
    }
  }
);

// GET /api/references/search
router.get(
  '/search',
  requireAuth,
  [query('q').trim().notEmpty().withMessage('Termo de busca obrigatório.')],
  validate,
  async (req, res) => {
    try {
      const q = req.query.q;
      const references = await prisma.reference.findMany({
        where: {
          userId: req.userId,
          OR: [
            { nome: { contains: q, mode: 'insensitive' } },
            { anotacoes: { contains: q, mode: 'insensitive' } },
            { subcategoria: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(references);
    } catch {
      res.status(500).json({ error: 'Erro na busca.' });
    }
  }
);

// PATCH /api/references/:id
router.patch(
  '/:id',
  requireAuth,
  [
    param('id').notEmpty(),
    body('nome').optional().trim().notEmpty().isLength({ max: 200 }),
    body('link').optional({ nullable: true }).isURL(),
    body('categoria').optional().trim().notEmpty().isIn(['design', 'seguranca', 'infraestrutura', 'codigo', 'prompts']),
    body('subcategoria').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('anotacoes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    body('corFundo').optional({ nullable: true }).trim().matches(/^#[0-9A-Fa-f]{3,6}$/),
  ],
  validate,
  async (req, res) => {
    try {
      const ref = await prisma.reference.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!ref) return res.status(404).json({ error: 'Referência não encontrada.' });

      const { nome, link, categoria, subcategoria, anotacoes, corFundo } = req.body;
      const updated = await prisma.reference.update({
        where: { id: req.params.id },
        data: {
          ...(nome !== undefined && { nome }),
          ...(link !== undefined && { link }),
          ...(categoria !== undefined && { categoria }),
          ...(subcategoria !== undefined && { subcategoria }),
          ...(anotacoes !== undefined && { anotacoes }),
          ...(corFundo !== undefined && { corFundo }),
        },
      });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Erro ao atualizar referência.' });
    }
  }
);

// DELETE /api/references/:id
router.delete(
  '/:id',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const ref = await prisma.reference.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!ref) return res.status(404).json({ error: 'Referência não encontrada.' });

      await prisma.reference.delete({ where: { id: req.params.id } });
      res.json({ message: 'Referência deletada.' });
    } catch {
      res.status(500).json({ error: 'Erro ao deletar referência.' });
    }
  }
);

// POST /api/references/:id/link/:projectId
router.post(
  '/:id/link/:projectId',
  requireAuth,
  [
    param('id').notEmpty(),
    param('projectId').notEmpty(),
    body('phaseNumero').optional().isInt({ min: 1, max: 8 }),
  ],
  validate,
  async (req, res) => {
    try {
      const ref = await prisma.reference.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!ref) return res.status(404).json({ error: 'Referência não encontrada.' });

      const project = await prisma.project.findFirst({ where: { id: req.params.projectId, userId: req.userId } });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const link = await prisma.projectReference.upsert({
        where: { projectId_referenceId: { projectId: req.params.projectId, referenceId: req.params.id } },
        update: { phaseNumero: req.body.phaseNumero ?? null },
        create: { projectId: req.params.projectId, referenceId: req.params.id, phaseNumero: req.body.phaseNumero ?? null },
      });

      res.status(201).json(link);
    } catch {
      res.status(500).json({ error: 'Erro ao vincular referência.' });
    }
  }
);

// DELETE /api/references/:id/link/:projectId
router.delete(
  '/:id/link/:projectId',
  requireAuth,
  [param('id').notEmpty(), param('projectId').notEmpty()],
  validate,
  async (req, res) => {
    try {
      await prisma.projectReference.deleteMany({
        where: { referenceId: req.params.id, projectId: req.params.projectId },
      });
      res.json({ message: 'Vínculo removido.' });
    } catch {
      res.status(500).json({ error: 'Erro ao desvincular referência.' });
    }
  }
);

export default router;
