import { Router } from 'express';
import {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} from '../validators/transaction.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/', validate(listTransactionsQuerySchema, 'query'), listTransactions);
router.get('/:id', getTransaction);
router.patch('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
