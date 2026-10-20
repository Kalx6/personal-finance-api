import { z } from 'zod';

const typeEnum = z.enum(['INCOME', 'EXPENSE'], {
  errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: typeEnum,
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').max(50).optional(),
    type: typeEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listCategoriesQuerySchema = z.object({
  type: typeEnum.optional(),
});
