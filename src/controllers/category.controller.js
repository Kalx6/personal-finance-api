import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeCategory } from '../utils/serialize.js';

// Every query below filters by userId, so users can only ever touch their own categories.
const findOwned = async (id, userId) => {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new AppError('Category not found', 404);
  return category;
};

export const createCategory = asyncHandler(async (req, res) => {
  const { name, type } = req.body;

  const duplicate = await prisma.category.findFirst({
    where: { userId: req.user.id, name: { equals: name, mode: 'insensitive' }, type },
  });
  if (duplicate) throw new AppError('You already have a category with this name and type', 409);

  const category = await prisma.category.create({ data: { name, type, userId: req.user.id } });
  res.status(201).json({ success: true, data: serializeCategory(category) });
});

export const listCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const categories = await prisma.category.findMany({
    where: { userId: req.user.id, ...(type && { type }) },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ success: true, data: categories.map(serializeCategory) });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const existing = await findOwned(req.params.id, req.user.id);

  // Changing INCOME <-> EXPENSE would make old transactions inconsistent
  if (req.body.type && req.body.type !== existing.type) {
    const used = await prisma.transaction.count({ where: { categoryId: existing.id } });
    if (used > 0) {
      throw new AppError('Cannot change the type of a category that has transactions', 400);
    }
  }

  const category = await prisma.category.update({ where: { id: existing.id }, data: req.body });
  res.status(200).json({ success: true, data: serializeCategory(category) });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const existing = await findOwned(req.params.id, req.user.id);

  // Schema uses onDelete: SetNull, so its transactions stay but become uncategorized
  await prisma.category.delete({ where: { id: existing.id } });
  res.status(200).json({ success: true, message: 'Category deleted' });
});
