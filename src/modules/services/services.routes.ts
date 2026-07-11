import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  listServicesQuerySchema,
} from './services.validation';
import { getServices, getService, createService, updateService, deleteService } from './services.controller';

export const serviceRouter = Router();

serviceRouter.get('/', validate(listServicesQuerySchema), getServices);
serviceRouter.get('/:id', validate(serviceIdParamSchema), getService);
serviceRouter.post('/', authenticate, authorize('TECHNICIAN'), validate(createServiceSchema), createService);
serviceRouter.put('/:id', authenticate, authorize('TECHNICIAN'), validate(updateServiceSchema), updateService);
serviceRouter.delete('/:id', authenticate, authorize('TECHNICIAN'), validate(serviceIdParamSchema), deleteService);
