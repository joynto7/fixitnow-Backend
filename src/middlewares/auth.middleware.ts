import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication token missing');
  }

  const token = header.slice('Bearer '.length);
  const payload = verifyToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(401, 'User no longer exists');
  }
  if (user.status === 'BANNED') {
    throw new AppError(403, 'Your account has been banned. Contact support.');
  }

  req.user = { id: user.id, role: user.role, email: user.email };
  next();
});
