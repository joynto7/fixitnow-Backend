import { Request, Response } from 'express';
import { BookingStatus } from '@prisma/client';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/apiResponse';
import * as bookingService from './bookings.service';

interface ListQuery {
  status?: BookingStatus;
  page: number;
  limit: number;
}

export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.createBooking(req.user!.id, req.body);
  sendSuccess(res, 201, 'Booking created', booking);
});

export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListQuery;
  const result = await bookingService.listCustomerBookings(req.user!.id, query);
  sendSuccess(res, 200, 'Bookings fetched', result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

export const getBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingForUser(req.params.id, req.user!);
  sendSuccess(res, 200, 'Booking fetched', booking);
});

export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user!.id);
  sendSuccess(res, 200, 'Booking cancelled', booking);
});

export const getTechnicianBookings = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListQuery;
  const result = await bookingService.listTechnicianBookings(req.user!.id, query);
  sendSuccess(res, 200, 'Bookings fetched', result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

export const updateTechnicianBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.updateBookingStatusByTechnician(
    req.params.id,
    req.user!.id,
    req.body.action
  );
  sendSuccess(res, 200, 'Booking updated', booking);
});
