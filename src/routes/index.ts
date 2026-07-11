import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { categoryPublicRouter, categoryAdminRouter } from '../modules/categories/categories.routes';
import { serviceRouter } from '../modules/services/services.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'FixItNow API v1', data: null });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryPublicRouter);
apiRouter.use('/admin/categories', categoryAdminRouter);
apiRouter.use('/services', serviceRouter);
