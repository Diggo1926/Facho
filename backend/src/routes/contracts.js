import { Router } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import { generateContractPdf } from '../services/contractPdf.js';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/contracts');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Apenas arquivos PDF são aceitos.'));
  },
});

function isPdf(buffer) {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && buffer[1] === 0x50 &&
    buffer[2] === 0x44 && buffer[3] === 0x46
  );
}

const CONTRACT_SELECT = {
  id: true, titulo: true, tipo: true, status: true, versao: true,
  valorTotal: true, assinadoEm: true, createdAt: true, updatedAt: true,
  templateId: true,
  files: {
    select: { id: true, tipoArquivo: true, nomeArquivo: true, tamanhoBytes: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
};

async function verifyProjectOwnership(projectId, userId) {
  const p = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  return !!p;
}

async function verifyContractAccess(contractId, userId) {
  const c = await prisma.contract.findFirst({
    where: { id: contractId },
    include: { project: { select: { userId: true } } },
  });
  if (!c || c.project.userId !== userId) return null;
  return c;
}

// ─── Router montado em /api/projects ────────────────────────────────────────
export const contractProjectRouter = Router();

// GET /api/projects/:projectId/contracts
contractProjectRouter.get('/:projectId/contracts', requireAuth, async (req, res) => {
  try {
    const isOwner = await verifyProjectOwnership(req.params.projectId, req.userId);
    if (!isOwner) return res.status(404).json({ error: 'Projeto não encontrado.' });

    const contracts = await prisma.contract.findMany({
      where: { projectId: req.params.projectId },
      select: CONTRACT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/projects/:projectId/contracts
contractProjectRouter.post(
  '/:projectId/contracts',
  requireAuth,
  [
    param('projectId').notEmpty(),
    body('templateId').notEmpty().withMessage('templateId obrigatório.'),
    body('titulo').trim().notEmpty().isLength({ max: 300 }).withMessage('Título obrigatório.'),
    body('dados').isObject().withMessage('dados deve ser um objeto.'),
    body('valorTotal').optional({ nullable: true }).isFloat({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const isOwner = await verifyProjectOwnership(req.params.projectId, req.userId);
      if (!isOwner) return res.status(404).json({ error: 'Projeto não encontrado.' });

      const { templateId, titulo, dados, valorTotal } = req.body;

      const template = await prisma.contractTemplate.findFirst({
        where: { id: templateId, userId: req.userId },
      });
      if (!template) return res.status(404).json({ error: 'Modelo não encontrado.' });

      const dadosCriptografados = encrypt(JSON.stringify(dados));

      const contract = await prisma.contract.create({
        data: {
          projectId: req.params.projectId,
          templateId,
          titulo,
          tipo: template.tipo,
          dados: dadosCriptografados,
          status: 'rascunho',
          versao: 1,
          valorTotal: valorTotal != null ? parseFloat(valorTotal) : null,
        },
        select: CONTRACT_SELECT,
      });

      res.status(201).json(contract);
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// ─── Router montado em /api/contracts ────────────────────────────────────────
export const contractRouter = Router();

// GET /api/contracts/:id
contractRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const c = await verifyContractAccess(req.params.id, req.userId);
    if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

    let dados = {};
    try { dados = JSON.parse(decrypt(c.dados)); } catch {}

    const { project: _p, dados: _d, ...rest } = c;
    res.json({ ...rest, dados });
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PUT /api/contracts/:id
contractRouter.put(
  '/:id',
  requireAuth,
  [
    param('id').notEmpty(),
    body('titulo').optional().trim().notEmpty().isLength({ max: 300 }),
    body('dados').optional().isObject(),
    body('status').optional().isIn(['rascunho', 'em_revisao', 'aprovado', 'assinado', 'cancelado']),
    body('valorTotal').optional({ nullable: true }).isFloat({ min: 0 }),
    body('assinadoEm').optional().isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const c = await verifyContractAccess(req.params.id, req.userId);
      if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

      if (c.status === 'assinado' && req.body.dados !== undefined) {
        return res.status(403).json({ error: 'Dados de contrato assinado não podem ser alterados.' });
      }

      const { titulo, dados, status, valorTotal, assinadoEm } = req.body;
      const dadosChanged = dados !== undefined;

      const updated = await prisma.contract.update({
        where: { id: req.params.id },
        data: {
          ...(titulo !== undefined && { titulo }),
          ...(dadosChanged && { dados: encrypt(JSON.stringify(dados)), versao: { increment: 1 } }),
          ...(status !== undefined && { status }),
          ...(valorTotal !== undefined && { valorTotal: valorTotal != null ? parseFloat(valorTotal) : null }),
          ...(assinadoEm !== undefined && { assinadoEm: new Date(assinadoEm) }),
        },
        select: CONTRACT_SELECT,
      });

      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// DELETE /api/contracts/:id — soft delete (marca cancelado)
contractRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const c = await verifyContractAccess(req.params.id, req.userId);
    if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

    if (c.status === 'assinado') {
      return res.status(403).json({ error: 'Contratos assinados não podem ser excluídos. Marque como cancelado via PUT.' });
    }

    await prisma.contract.update({ where: { id: req.params.id }, data: { status: 'cancelado' } });
    res.json({ message: 'Contrato cancelado.' });
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// DELETE /api/contracts/:id/dados — remove dados pessoais (LGPD)
contractRouter.delete('/:id/dados', requireAuth, async (req, res) => {
  try {
    const c = await verifyContractAccess(req.params.id, req.userId);
    if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

    await prisma.contract.update({
      where: { id: req.params.id },
      data: { dados: encrypt(JSON.stringify({})) },
    });
    res.json({ message: 'Dados pessoais removidos.' });
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/contracts/:id/generate-pdf
contractRouter.post('/:id/generate-pdf', requireAuth, async (req, res) => {
  try {
    const c = await verifyContractAccess(req.params.id, req.userId);
    if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

    const template = await prisma.contractTemplate.findUnique({ where: { id: c.templateId } });
    if (!template) return res.status(404).json({ error: 'Modelo não encontrado.' });

    let dados = {};
    try { dados = JSON.parse(decrypt(c.dados)); } catch {}

    const pdfBuffer = await generateContractPdf({ ...c, dados }, template);

    const fileName = `contrato-${randomUUID()}.pdf`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    writeFileSync(filePath, pdfBuffer);

    await prisma.contractFile.create({
      data: {
        contractId: req.params.id,
        tipoArquivo: 'gerado',
        nomeArquivo: fileName,
        mimeType: 'application/pdf',
        tamanhoBytes: pdfBuffer.length,
        caminhoStorage: filePath,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contrato.pdf"');
    res.send(pdfBuffer);
  } catch {
    res.status(500).json({ error: 'Erro ao gerar PDF.' });
  }
});

// POST /api/contracts/:id/upload-signed
contractRouter.post(
  '/:id/upload-signed',
  requireAuth,
  upload.single('pdf'),
  async (req, res) => {
    try {
      const c = await verifyContractAccess(req.params.id, req.userId);
      if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

      if (!req.file) return res.status(400).json({ error: 'Arquivo PDF obrigatório.' });
      if (!isPdf(req.file.buffer)) return res.status(400).json({ error: 'O arquivo não é um PDF válido.' });

      const fileName = `assinado-${randomUUID()}.pdf`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      writeFileSync(filePath, req.file.buffer);

      const contractFile = await prisma.contractFile.create({
        data: {
          contractId: req.params.id,
          tipoArquivo: 'assinado',
          nomeArquivo: fileName,
          mimeType: 'application/pdf',
          tamanhoBytes: req.file.size,
          caminhoStorage: filePath,
        },
      });

      await prisma.contract.update({
        where: { id: req.params.id },
        data: { status: 'assinado', assinadoEm: new Date() },
      });

      res.json(contractFile);
    } catch (err) {
      if (err.message === 'Apenas arquivos PDF são aceitos.') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erro ao processar upload.' });
    }
  }
);

// GET /api/contracts/:id/files/:fileId
contractRouter.get('/:id/files/:fileId', requireAuth, async (req, res) => {
  try {
    const c = await verifyContractAccess(req.params.id, req.userId);
    if (!c) return res.status(404).json({ error: 'Contrato não encontrado.' });

    const file = await prisma.contractFile.findFirst({
      where: { id: req.params.fileId, contractId: req.params.id },
    });
    if (!file) return res.status(404).json({ error: 'Arquivo não encontrado.' });

    const safePath = path.resolve(file.caminhoStorage);
    if (!safePath.startsWith(UPLOAD_DIR)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${file.tipoArquivo}.pdf"`);
    res.sendFile(safePath);
  } catch {
    res.status(500).json({ error: 'Erro ao baixar arquivo.' });
  }
});
