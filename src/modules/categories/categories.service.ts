import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

interface CategoryInput {
  name: string;
  description?: string;
}

export const listCategories = async () => {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
};

export const createCategory = async (data: CategoryInput) => {
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new AppError(409, 'A category with this name already exists');
  }
  return prisma.category.create({ data });
};

export const updateCategory = async (id: string, data: Partial<CategoryInput>) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(404, 'Category not found');
  }
  return prisma.category.update({ where: { id }, data });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(404, 'Category not found');
  }
  const serviceCount = await prisma.service.count({ where: { categoryId: id } });
  if (serviceCount > 0) {
    throw new AppError(400, 'Cannot delete a category that still has services under it');
  }
  await prisma.category.delete({ where: { id } });
};
