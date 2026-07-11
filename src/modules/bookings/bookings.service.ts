import { Prisma, BookingStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

const bookingInclude = {
  service: { include: { category: true } },
  technician: { include: { user: { select: { id: true, name: true, phone: true } } } },
  customer: { select: { id: true, name: true, email: true, phone: true } },
  payment: true,
} satisfies Prisma.BookingInclude;

interface CreateBookingInput {
  serviceId: string;
  scheduledDate: Date;
  address: string;
  notes?: string;
}

interface ListQuery {
  status?: BookingStatus;
  page: number;
  limit: number;
}

export const createBooking = async (customerId: string, data: CreateBookingInput) => {
  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, technician: { user: { status: 'ACTIVE' } } },
  });
  if (!service) {
    throw new AppError(404, 'Service not found');
  }

  return prisma.booking.create({
    data: {
      customerId,
      technicianId: service.technicianId,
      serviceId: service.id,
      scheduledDate: data.scheduledDate,
      address: data.address,
      notes: data.notes,
      price: service.price,
      status: 'REQUESTED',
    },
    include: bookingInclude,
  });
};

export const listCustomerBookings = async (customerId: string, query: ListQuery) => {
  const where: Prisma.BookingWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page: query.page, limit: query.limit };
};

export const listTechnicianBookings = async (userId: string, query: ListQuery) => {
  const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }
  const where: Prisma.BookingWhereInput = {
    technicianId: profile.id,
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page: query.page, limit: query.limit };
};

export const getBookingForUser = async (bookingId: string, requester: { id: string; role: Role }) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: bookingInclude });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  const isCustomer = booking.customerId === requester.id;
  const isTechnician = booking.technician.user.id === requester.id;
  const isAdmin = requester.role === 'ADMIN';

  if (!isCustomer && !isTechnician && !isAdmin) {
    throw new AppError(403, 'You do not have access to this booking');
  }
  return booking;
};

const CANCELLABLE_STATUSES: BookingStatus[] = ['REQUESTED', 'ACCEPTED', 'PAID'];

export const cancelBooking = async (bookingId: string, customerId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.customerId !== customerId) {
    throw new AppError(403, 'You can only cancel your own bookings');
  }
  if (!CANCELLABLE_STATUSES.includes(booking.status)) {
    throw new AppError(400, `A booking that is ${booking.status} can no longer be cancelled`);
  }
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
    include: bookingInclude,
  });
};

type TechnicianAction = 'ACCEPT' | 'DECLINE' | 'START' | 'COMPLETE';

const TECHNICIAN_TRANSITIONS: Record<TechnicianAction, { from: BookingStatus[]; to: BookingStatus }> = {
  ACCEPT: { from: ['REQUESTED'], to: 'ACCEPTED' },
  DECLINE: { from: ['REQUESTED'], to: 'DECLINED' },
  START: { from: ['PAID'], to: 'IN_PROGRESS' },
  COMPLETE: { from: ['IN_PROGRESS'], to: 'COMPLETED' },
};

export const updateBookingStatusByTechnician = async (
  bookingId: string,
  userId: string,
  action: TechnicianAction
) => {
  const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.technicianId !== profile.id) {
    throw new AppError(403, 'You can only manage your own bookings');
  }

  const transition = TECHNICIAN_TRANSITIONS[action];
  if (!transition.from.includes(booking.status)) {
    throw new AppError(400, `Cannot ${action.toLowerCase()} a booking that is currently ${booking.status}`);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: transition.to },
    include: bookingInclude,
  });
};
