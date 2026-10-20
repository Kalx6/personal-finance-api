import { Router } from 'express';
import { monthlyReport } from '../controllers/report.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { monthlyReportQuerySchema } from '../validators/report.validator.js';

const router = Router();

router.use(authenticate);

router.get('/monthly', validate(monthlyReportQuerySchema, 'query'), monthlyReport);

export default router;
