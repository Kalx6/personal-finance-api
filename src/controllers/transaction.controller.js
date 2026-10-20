import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeTransaction } from '../utils/serialize.js';
import { monthRange, yearRange } from '../utils/dates.js';

const include = { category: true };

// Every query filters by userId: other users' data looks like it doesn't exist (404).
const findOwned = async (id, userId) => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId }, include });
  if (!transaction) throw new AppError('Transaction not found', 404);
  return transaction;
};

// A category must belong to the user AND match the transaction type.
const assertCategoryUsable = async (categoryId, userId, type) => {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new AppError('Category not found', 404);
  if (category.type !== type) {
    throw new AppError(`Category type (${category.type}) does not match transaction type (${type})`, 400);
  }
};

export const createTransaction = asyncHandler(async (req, res) => {
  const { amount, type, description, date, categoryId } = req.body;

  await assertCategoryUsable(categoryId, req.user.id, type);

  const transaction = await prisma.transaction.create({
    data: { amount, type, description, date, categoryId: categoryId ?? null, userId: req.user.id },
    include,
  });

  res.status(201).json({ success: true, data: serializeTransaction(transaction) });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, type, categoryId, month, year } = req.query;

  const where = {
    userId: req.user.id,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(year && { date: month ? monthRange(year, month) : yearRange(year) }),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: items.map(serializeTransaction),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await findOwned(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: serializeTransaction(transaction) });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const existing = await findOwned(req.params.id, req.user.id);

  // Re-check category/type consistency using the values the transaction will have after the update
  const type = req.body.type ?? existing.type;
  const categoryId = req.body.categoryId !== undefined ? req.body.categoryId : existing.categoryId;
  if (req.body.type || req.body.categoryId !== undefined) {
    await assertCategoryUsable(categoryId, req.user.id, type);
  }

  const transaction = await prisma.transaction.update({
    where: { id: existing.id },
    data: req.body,
    include,
  });

  res.status(200).json({ success: true, data: serializeTransaction(transaction) });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const existing = await findOwned(req.params.id, req.user.id);
  await prisma.transaction.delete({ where: { id: existing.id } });
  res.status(200).json({ success: true, message: 'Transaction deleted' });
});
