import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { categoryPublicRouter, categoryAdminRouter } from '../modules/categories/categories.routes';
import { serviceRouter } from '../modules/services/services.routes';
import { technicianPublicRouter, technicianSelfRouter } from '../modules/technicians/technicians.routes';
import { bookingRouter, technicianBookingRouter } from '../modules/bookings/bookings.routes';
import { paymentRouter } from '../modules/payments/payments.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'FixItNow API v1', data: null });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryPublicRouter);
apiRouter.use('/admin/categories', categoryAdminRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/technicians', technicianPublicRouter);
// More specific /technician/bookings must be registered before /technician
// so it isn't swallowed by technicianSelfRouter's mount.
apiRouter.use('/technician/bookings', technicianBookingRouter);
apiRouter.use('/technician', technicianSelfRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/payments', paymentRouter);
