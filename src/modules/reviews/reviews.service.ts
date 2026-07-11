import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
}

export const createReview = async (customerId: string, data: CreateReviewInput) => {
  const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.customerId !== customerId) {
    throw new AppError(403, 'You can only review your own bookings');
  }
  if (booking.status !== 'COMPLETED') {
    throw new AppError(400, `Booking must be COMPLETED before it can be reviewed (currently ${booking.status})`);
  }

  const existingReview = await prisma.review.findUnique({ where: { bookingId: booking.id } });
  if (existingReview) {
    throw new AppError(409, 'This booking has already been reviewed');
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        bookingId: booking.id,
        customerId,
        technicianId: booking.technicianId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    const aggregate = await tx.review.aggregate({
      where: { technicianId: booking.technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.technicianProfile.update({
      where: { id: booking.technicianId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating,
      },
    });

    return review;
  });
};
