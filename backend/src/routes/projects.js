import { Router } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { buildContext } from '../services/contextBuilder.js';
import { generateProposal } from '../services/proposal.js';

const router = Router();
const prisma = new PrismaClient();

const PHASE_NAMES = [
  'Briefing',
  'Referências',
  'Identidade',
  'Wireframe',
  'Design',
  'Código',
  'Testes',
  'Deploy',
];

// POST /api/projects
router.post(
  '/',
  requireAuth,
  [
    body('nome').trim().notEmpty().withMessage('Nome do projeto obrigatório.'),
    body('descricao').trim().notEmpty().withMessage('Descrição obrigatória.'),
    body('tipo').optional().trim(),
    body('complexidade').optional().trim(),
    body('cliente').optional().trim(),
    body('icone').optional().trim(),
    body('fasesConcluidasAte').optional().isInt({ min: 0, max: 8 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { nome, tipo, complexidade, cliente, descricao, icone, fasesConcluidasAte = 0 } = req.body;

      const project = await prisma.project.create({
        data: {
          userId: req.userId,
          nome,
          tipo,
          complexidade,
          cliente,
          descricao,
          icone,
          currentPhase: fasesConcluidasAte >= 8 ? 8 : fasesConcluidasAte + 1,
          status: fasesConcluidasAte >= 8 ? 'concluido' : 'andamento',
          phases: {
            create: PHASE_NAMES.map((phaseName, i) => ({
              numero: i + 1,
              nome: phaseName,
              status:
                i + 1 <= fasesConcluidasAte
                  ? 'concluida'
                  : i + 1 === fasesConcluidasAte + 1 && fasesConcluidasAte < 8
                  ? 'ativa'
                  : 'pendente',
            })),
          },
        },
        include: { phases: { orderBy: { numero: 'asc' } } },
      });

      res.status(201).json(project);
    } catch {
      res.status(500).json({ error: 'Erro ao criar projeto.' });
    }
  }
);

// GET /api/projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      include: {
        phases: { orderBy: { numero: 'asc' } },
        _count: { select: { references: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Erro ao listar projetos.' });
  }
});

// GET /api/projects/:id
router.get(
  '/:id',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: {
          phases: { orderBy: { numero: 'asc' } },
          references: {
            include: { reference: true },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
      res.json(project);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar projeto.' });
    }
  }
);

// PATCH /api/projects/:id
router.patch(
  '/:id',
  requireAuth,
  [
    param('id').notEmpty(),
    body('nome').optional().trim().notEmpty(),
    body('tipo').optional().trim(),
    body('complexidade').optional().trim(),
    body('cliente').optional().trim(),
    body('descricao').optional().trim(),
    body('icone').optional().trim(),
    body('status').optional().isIn(['andamento', 'pausado', 'concluido']),
  ],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const { nome, tipo, complexidade, cliente, descricao, icone, status } = req.body;
      const updated = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(nome !== undefined && { nome }),
          ...(tipo !== undefined && { tipo }),
          ...(complexidade !== undefined && { complexidade }),
          ...(cliente !== undefined && { cliente }),
          ...(descricao !== undefined && { descricao }),
          ...(icone !== undefined && { icone }),
          ...(status !== undefined && { status }),
        },
        include: { phases: { orderBy: { numero: 'asc' } } },
      });

      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
  }
);

// DELETE /api/projects/:id
router.delete(
  '/:id',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      await prisma.project.delete({ where: { id: req.params.id } });
      res.json({ message: 'Projeto deletado.' });
    } catch {
      res.status(500).json({ error: 'Erro ao deletar projeto.' });
    }
  }
);

// GET /api/projects/:id/context
router.get(
  '/:id/context',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: {
          phases: { orderBy: { numero: 'asc' } },
          references: { include: { reference: true } },
        },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const preferences = await prisma.preferences.findUnique({ where: { userId: req.userId } });
      const refs = project.references.map((pr) => pr.reference);

      const context = buildContext(project, project.phases, refs, preferences);
      res.json({ context });
    } catch {
      res.status(500).json({ error: 'Erro ao gerar contexto.' });
    }
  }
);

// POST /api/projects/:id/proposal
router.post(
  '/:id/proposal',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: { phases: { orderBy: { numero: 'asc' } } },
      });

      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const pdf = await generateProposal(project, project.phases);

      const filename = `proposta-${project.nome.toLowerCase().replace(/ /g, '-')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdf);
    } catch (err) {
      console.error('Proposal error:', err.message);
      res.status(500).json({ error: 'Erro ao gerar proposta.' });
    }
  }
);

// POST /api/projects/:id/sessions
router.post(
  '/:id/sessions',
  requireAuth,
  [param('id').notEmpty(), body('resumo').optional().trim()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const session = await prisma.sessionLog.create({
        data: {
          projectId: project.id,
          resumo: req.body.resumo || `Sessão — ${new Date().toLocaleDateString('pt-BR')}`,
          contextoExportado: req.body.contextoExportado ?? false,
        },
      });

      res.json(session);
    } catch {
      res.status(500).json({ error: 'Erro ao criar sessão.' });
    }
  }
);

// GET /api/projects/:id/sessions
router.get(
  '/:id/sessions',
  requireAuth,
  [param('id').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const sessions = await prisma.sessionLog.findMany({
        where: { projectId: req.params.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json(sessions);
    } catch {
      res.status(500).json({ error: 'Erro ao listar sessões.' });
    }
  }
);

// POST /api/projects/:id/save-as-template
router.post(
  '/:id/save-as-template',
  requireAuth,
  [param('id').notEmpty(), body('nomeTemplate').optional().trim()],
  validate,
  async (req, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: { phases: { orderBy: { numero: 'asc' } } },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const faseData = {};
      for (const phase of project.phases) {
        faseData[`fase${phase.numero}`] = phase.resultado;
      }

      const template = await prisma.projectTemplate.create({
        data: {
          userId: req.userId,
          nome: req.body.nomeTemplate || `Template — ${project.nome}`,
          tipo: project.tipo || '',
          complexidade: project.complexidade,
          descricao: project.descricao,
          icone: project.icone,
          ...faseData,
        },
      });

      res.json(template);
    } catch {
      res.status(500).json({ error: 'Erro ao salvar template.' });
    }
  }
);

export default router;
