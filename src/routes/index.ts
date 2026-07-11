import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'FixItNow API v1', data: null });
});

apiRouter.use('/auth', authRouter);
