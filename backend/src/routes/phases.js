import { Router } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

async function getPhase(projectId, phaseNumber, userId) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return null;
  return prisma.phase.findUnique({ where: { projectId_numero: { projectId, numero: phaseNumber } } });
}

// GET /api/phases/:projectId/:phaseNumber
router.get(
  '/:projectId/:phaseNumber',
  requireAuth,
  [param('projectId').notEmpty(), param('phaseNumber').isInt({ min: 1, max: 8 })],
  validate,
  async (req, res) => {
    try {
      const phase = await getPhase(req.params.projectId, parseInt(req.params.phaseNumber), req.userId);
      if (!phase) return res.status(404).json({ error: 'Fase não encontrada.' });
      res.json(phase);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar fase.' });
    }
  }
);

// PATCH /api/phases/:projectId/:phaseNumber
router.patch(
  '/:projectId/:phaseNumber',
  requireAuth,
  [
    param('projectId').notEmpty(),
    param('phaseNumber').isInt({ min: 1, max: 8 }),
    body('notas').optional({ nullable: true }).isString().isLength({ max: 10000 }),
    body('resultado').optional({ nullable: true }),
    body('paleta').optional({ nullable: true }),
    body('tipografia').optional({ nullable: true }),
    body('status').optional().isIn(['pendente', 'ativa', 'concluida']),
  ],
  validate,
  async (req, res) => {
    try {
      const phaseNumber = parseInt(req.params.phaseNumber);
      const phase = await getPhase(req.params.projectId, phaseNumber, req.userId);
      if (!phase) return res.status(404).json({ error: 'Fase não encontrada.' });

      const { notas, resultado, paleta, tipografia, status } = req.body;
      const updated = await prisma.phase.update({
        where: { projectId_numero: { projectId: req.params.projectId, numero: phaseNumber } },
        data: {
          ...(notas !== undefined && { notas }),
          ...(resultado !== undefined && { resultado }),
          ...(paleta !== undefined && { paleta }),
          ...(tipografia !== undefined && { tipografia }),
          ...(status !== undefined && { status }),
        },
      });

      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Erro ao atualizar fase.' });
    }
  }
);

// POST /api/phases/:projectId/:phaseNumber/conclude
router.post(
  '/:projectId/:phaseNumber/conclude',
  requireAuth,
  [
    param('projectId').notEmpty(),
    param('phaseNumber').isInt({ min: 1, max: 8 }),
  ],
  validate,
  async (req, res) => {
    try {
      const phaseNumber = parseInt(req.params.phaseNumber);
      const project = await prisma.project.findFirst({
        where: { id: req.params.projectId, userId: req.userId },
        include: { phases: { orderBy: { numero: 'asc' } } },
      });
      if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const phase = project.phases.find((p) => p.numero === phaseNumber);
      if (!phase) return res.status(404).json({ error: 'Fase não encontrada.' });

      if (phaseNumber > 1) {
        const prev = project.phases.find((p) => p.numero === phaseNumber - 1);
        if (prev?.status !== 'concluida') {
          return res.status(400).json({ error: 'A fase anterior precisa estar concluída primeiro.' });
        }
      }

      await prisma.phase.update({
        where: { projectId_numero: { projectId: req.params.projectId, numero: phaseNumber } },
        data: { status: 'concluida' },
      });

      const nextPhase = phaseNumber + 1;
      if (nextPhase <= 8) {
        await prisma.phase.update({
          where: { projectId_numero: { projectId: req.params.projectId, numero: nextPhase } },
          data: { status: 'ativa' },
        });
        await prisma.project.update({
          where: { id: req.params.projectId },
          data: { currentPhase: nextPhase },
        });
      } else {
        await prisma.project.update({
          where: { id: req.params.projectId },
          data: { status: 'concluido' },
        });
      }

      const updatedProject = await prisma.project.findUnique({
        where: { id: req.params.projectId },
        include: { phases: { orderBy: { numero: 'asc' } } },
      });

      res.json(updatedProject);
    } catch {
      res.status(500).json({ error: 'Erro ao concluir fase.' });
    }
  }
);

export default router;
