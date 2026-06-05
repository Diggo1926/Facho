import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();
const prisma = new PrismaClient();

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido.'),
    body('password').notEmpty().withMessage('Senha obrigatória.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);

      await prisma.refreshToken.create({
        data: {
          token: hashToken(refreshToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token obrigatório.')],
  validate,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      let payload;
      try {
        payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch {
        return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
      }

      const tokenHash = hashToken(refreshToken);
      const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });
      if (!stored || stored.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Refresh token inválido.' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.userId);

      await prisma.refreshToken.delete({ where: { token: tokenHash } });
      await prisma.refreshToken.create({
        data: {
          token: hashToken(newRefreshToken),
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// POST /api/auth/logout
router.post(
  '/logout',
  [body('refreshToken').notEmpty().withMessage('Refresh token obrigatório.')],
  validate,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      await prisma.refreshToken.deleteMany({ where: { token: hashToken(refreshToken) } });
      res.json({ message: 'Logout realizado com sucesso.' });
    } catch {
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

export default router;
