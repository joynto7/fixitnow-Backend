import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  updateTechnicianProfileSchema,
  setAvailabilitySchema,
  technicianIdParamSchema,
  listTechniciansQuerySchema,
} from './technicians.validation';
import {
  getTechnicians,
  getTechnician,
  updateProfile,
  setAvailability,
  getAvailability,
} from './technicians.controller';

export const technicianPublicRouter = Router();
technicianPublicRouter.get('/', validate(listTechniciansQuerySchema), getTechnicians);
technicianPublicRouter.get('/:id', validate(technicianIdParamSchema), getTechnician);

export const technicianSelfRouter = Router();
technicianSelfRouter.use(authenticate, authorize('TECHNICIAN'));
technicianSelfRouter.put('/profile', validate(updateTechnicianProfileSchema), updateProfile);
technicianSelfRouter.put('/availability', validate(setAvailabilitySchema), setAvailability);
technicianSelfRouter.get('/availability', getAvailability);
