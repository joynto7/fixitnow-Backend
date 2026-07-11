import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './categories.validation';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller';

export const categoryPublicRouter = Router();
categoryPublicRouter.get('/', getCategories);

export const categoryAdminRouter = Router();
categoryAdminRouter.use(authenticate, authorize('ADMIN'));
categoryAdminRouter.get('/', getCategories);
categoryAdminRouter.post('/', validate(createCategorySchema), createCategory);
categoryAdminRouter.put('/:id', validate(updateCategorySchema), updateCategory);
categoryAdminRouter.delete('/:id', validate(categoryIdParamSchema), deleteCategory);
