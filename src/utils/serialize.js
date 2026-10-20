// Money is always returned as a string with 2 decimals (e.g. "250.00")
export const serializeTransaction = (t) => ({
  id: t.id,
  amount: t.amount.toFixed(2),
  type: t.type,
  description: t.description,
  date: t.date,
  categoryId: t.categoryId,
  category: t.category ? { id: t.category.id, name: t.category.name, type: t.category.type } : null,
  createdAt: t.createdAt,
});

export const serializeCategory = (c) => ({
  id: c.id,
  name: c.name,
  type: c.type,
});

export const serializeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  createdAt: u.createdAt,
});
