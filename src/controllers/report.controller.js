import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';
import { monthRange } from '../utils/dates.js';

export const monthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  // Only the logged-in user's transactions inside the requested month
  const totals = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId: req.user.id, date: monthRange(year, month) },
    _sum: { amount: true },
  });

  const sumFor = (type) =>
    totals.find((t) => t.type === type)?._sum.amount ?? new Prisma.Decimal(0);

  const income = sumFor('INCOME');
  const expenses = sumFor('EXPENSE');

  res.status(200).json({
    month,
    year,
    totalIncome: income.toFixed(2),
    totalExpenses: expenses.toFixed(2),
    balance: income.minus(expenses).toFixed(2),
  });
});
