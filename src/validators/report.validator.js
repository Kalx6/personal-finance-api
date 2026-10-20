import { z } from 'zod';

export const monthlyReportQuerySchema = z.object({
  month: z.coerce
    .number({ invalid_type_error: 'month must be a number' })
    .int()
    .min(1, 'month must be between 1 and 12')
    .max(12, 'month must be between 1 and 12'),
  year: z.coerce
    .number({ invalid_type_error: 'year must be a number' })
    .int()
    .min(2000, 'year must be between 2000 and 2100')
    .max(2100, 'year must be between 2000 and 2100'),
});
