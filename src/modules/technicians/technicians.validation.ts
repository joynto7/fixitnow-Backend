import { z } from 'zod';

export const updateTechnicianProfileSchema = z.object({
  body: z.object({
    bio: z.string().trim().max(1000).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    location: z.string().trim().max(150).optional(),
  }),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const availabilitySlotSchema = z
  .object({
    date: z.coerce.date(),
    startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm format'),
    endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm format'),
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  });

export const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(availabilitySlotSchema).min(1, 'Provide at least one slot'),
  }),
});

export const technicianIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid technician id') }),
});

export const listTechniciansQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional(),
    location: z.string().trim().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
