import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/apiResponse';
import { sanitizeUser } from '../../utils/sanitizeUser';
import { AppError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { registerUser, loginUser } from './auth.service';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await registerUser(req.body);
  sendSuccess(res, 201, 'Registration successful', { user: sanitizeUser(user), token });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, token } = await loginUser(email, password);
  sendSuccess(res, 200, 'Login successful', { user: sanitizeUser(user), token });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { technicianProfile: true },
  });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  sendSuccess(res, 200, 'Current user fetched', sanitizeUser(user));
});
