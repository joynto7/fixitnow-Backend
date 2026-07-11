import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

interface ListServicesQuery {
  categoryId?: string;
  technicianId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page: number;
  limit: number;
}

interface ServiceInput {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
}

const technicianInclude = {
  category: true,
  technician: { include: { user: { select: { id: true, name: true } } } },
} satisfies Prisma.ServiceInclude;

export const listServices = async (query: ListServicesQuery) => {
  const where: Prisma.ServiceWhereInput = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.technicianId ? { technicianId: query.technicianId } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: technicianInclude,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
};

export const getServiceById = async (id: string) => {
  const service = await prisma.service.findUnique({ where: { id }, include: technicianInclude });
  if (!service) {
    throw new AppError(404, 'Service not found');
  }
  return service;
};

const getOwnTechnicianProfile = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }
  return profile;
};

const assertCategoryExists = async (categoryId: string) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError(404, 'Category not found');
  }
};

export const createService = async (userId: string, data: ServiceInput) => {
  const profile = await getOwnTechnicianProfile(userId);
  await assertCategoryExists(data.categoryId);

  return prisma.service.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      technicianId: profile.id,
    },
    include: technicianInclude,
  });
};

export const updateService = async (userId: string, serviceId: string, data: Partial<ServiceInput>) => {
  const profile = await getOwnTechnicianProfile(userId);
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError(404, 'Service not found');
  }
  if (service.technicianId !== profile.id) {
    throw new AppError(403, 'You can only update your own services');
  }
  if (data.categoryId) {
    await assertCategoryExists(data.categoryId);
  }

  return prisma.service.update({ where: { id: serviceId }, data, include: technicianInclude });
};

export const deleteService = async (userId: string, serviceId: string) => {
  const profile = await getOwnTechnicianProfile(userId);
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError(404, 'Service not found');
  }
  if (service.technicianId !== profile.id) {
    throw new AppError(403, 'You can only delete your own services');
  }
  const bookingCount = await prisma.booking.count({ where: { serviceId } });
  if (bookingCount > 0) {
    throw new AppError(400, 'Cannot delete a service that already has bookings');
  }
  await prisma.service.delete({ where: { id: serviceId } });
};
