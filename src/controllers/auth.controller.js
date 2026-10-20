import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeUser } from '../utils/serialize.js';

const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email is already registered', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed } });

  res.status(201).json({
    success: true,
    data: { user: serializeUser(user), token: signToken(user.id) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.password));

  // Same message for "no such user" and "wrong password" so emails can't be probed
  if (!ok) throw new AppError('Invalid email or password', 401);

  res.status(200).json({
    success: true,
    data: { user: serializeUser(user), token: signToken(user.id) },
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError('User no longer exists', 401);

  res.status(200).json({ success: true, data: { user: serializeUser(user) } });
});
