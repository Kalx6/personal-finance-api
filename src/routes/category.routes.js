import { Router } from 'express';
import {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
} from '../validators/category.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCategorySchema), createCategory);
router.get('/', validate(listCategoriesQuerySchema, 'query'), listCategories);
router.patch('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
