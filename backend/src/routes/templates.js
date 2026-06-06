import { Router } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

const FASE_NOMES = ['Ideia', 'Arquitetura', 'Design', 'Segurança', 'Desenvolvimento', 'Testes', 'Deploy', 'Entrega'];

// GET /api/templates
router.get('/', requireAuth, async (req, res) => {
  try {
    const templates = await prisma.projectTemplate.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(templates);
  } catch {
    res.status(500).json({ error: 'Erro ao listar templates.' });
  }
});

// POST /api/templates
router.post(
  '/',
  requireAuth,
  [
    body('nome').trim().notEmpty().withMessage('Nome obrigatório.'),
    body('tipo').trim().notEmpty().withMessage('Tipo obrigatório.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { nome, tipo, complexidade, descricao, icone } = req.body;
      const template = await prisma.projectTemplate.create({
        data: { userId: req.userId, nome, tipo, complexidade, descricao, icone },
      });
      res.status(201).json(template);
    } catch {
      res.status(500).json({ error: 'Erro ao criar template.' });
    }
  }
);

// POST /api/templates/:id/use — criar projeto a partir do template
router.post(
  '/:id/use',
  requireAuth,
  [
    param('id').notEmpty(),
    body('nome').trim().notEmpty().withMessage('Nome do projeto obrigatório.'),
  ],
  validate,
  async (req, res) => {
    try {
      const template = await prisma.projectTemplate.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!template) return res.status(404).json({ error: 'Template não encontrado.' });

      const project = await prisma.project.create({
        data: {
          userId: req.userId,
          nome: req.body.nome,
          cliente: req.body.cliente || null,
          tipo: template.tipo,
          complexidade: template.complexidade,
          descricao: template.descricao || '',
          icone: template.icone,
          status: 'andamento',
          currentPhase: 1,
        },
      });

      for (let i = 1; i <= 8; i++) {
        await prisma.phase.create({
          data: {
            projectId: project.id,
            numero: i,
            nome: FASE_NOMES[i - 1],
            status: i === 1 ? 'ativa' : 'pendente',
            resultado: template[`fase${i}`] || null,
          },
        });
      }

      res.json(project);
    } catch {
      res.status(500).json({ error: 'Erro ao criar projeto a partir do template.' });
    }
  }
);

// DELETE /api/templates/:id
router.delete(
  '/:id',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const template = await prisma.projectTemplate.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!template) return res.status(404).json({ error: 'Template não encontrado.' });

      await prisma.projectTemplate.delete({ where: { id: req.params.id } });
      res.json({ message: 'Template deletado.' });
    } catch {
      res.status(500).json({ error: 'Erro ao deletar template.' });
    }
  }
);

export default router;
