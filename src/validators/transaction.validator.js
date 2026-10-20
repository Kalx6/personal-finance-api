import { z } from 'zod';

const typeEnum = z.enum(['INCOME', 'EXPENSE'], {
  errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
});

const amount = z.coerce
  .number({ invalid_type_error: 'Amount must be a number' })
  .positive('Amount must be greater than zero')
  .max(9999999999.99, 'Amount is too large')
  .refine((v) => Math.round(v * 100) / 100 === v, 'Amount can have at most 2 decimal places');

const description = z.string().trim().max(255, 'Description is too long');
const date = z.coerce.date({ invalid_type_error: 'Invalid date' });

export const createTransactionSchema = z.object({
  amount,
  type: typeEnum,
  description: description.optional(),
  date: date.optional(),
  categoryId: z.string().min(1).nullable().optional(),
});

export const updateTransactionSchema = z
  .object({
    amount: amount.optional(),
    type: typeEnum.optional(),
    description: description.nullable().optional(),
    date: date.optional(),
    categoryId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    type: typeEnum.optional(),
    categoryId: z.string().min(1).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .refine((q) => !q.month || q.year, {
    message: 'year is required when filtering by month',
    path: ['year'],
  });
