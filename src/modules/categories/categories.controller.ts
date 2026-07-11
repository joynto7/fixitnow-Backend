import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/apiResponse';
import * as categoryService from './categories.service';

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  sendSuccess(res, 200, 'Categories fetched', categories);
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, 201, 'Category created', category);
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, 200, 'Category updated', category);
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, 200, 'Category deleted', null);
});
