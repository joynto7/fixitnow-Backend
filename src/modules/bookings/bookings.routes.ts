import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createBookingSchema,
  bookingIdParamSchema,
  listBookingsQuerySchema,
  updateTechnicianBookingStatusSchema,
} from './bookings.validation';
import {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getTechnicianBookings,
  updateTechnicianBookingStatus,
} from './bookings.controller';

export const bookingRouter = Router();
bookingRouter.use(authenticate);
bookingRouter.post('/', authorize('CUSTOMER'), validate(createBookingSchema), createBooking);
bookingRouter.get('/', authorize('CUSTOMER'), validate(listBookingsQuerySchema), getMyBookings);
bookingRouter.get('/:id', validate(bookingIdParamSchema), getBooking);
bookingRouter.patch('/:id/cancel', authorize('CUSTOMER'), validate(bookingIdParamSchema), cancelBooking);

export const technicianBookingRouter = Router();
technicianBookingRouter.use(authenticate, authorize('TECHNICIAN'));
technicianBookingRouter.get('/', validate(listBookingsQuerySchema), getTechnicianBookings);
technicianBookingRouter.patch('/:id', validate(updateTechnicianBookingStatusSchema), updateTechnicianBookingStatus);
