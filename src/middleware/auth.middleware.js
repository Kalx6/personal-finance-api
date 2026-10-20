import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

// Verifies the Bearer token and attaches req.user = { id }.
// The user id ALWAYS comes from the token, never from the request body.
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    next(new AppError(message, 401));
  }
};

export default authenticate;
