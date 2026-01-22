import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../shared/errors/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email?: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(new UnauthorizedError('Token de acesso requerido'));
  }

  // Validar que JWT_SECRET está configurado
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return next(new Error('JWT_SECRET não configurado'));
    }
    // Apenas em desenvolvimento, usar fallback com warning
    console.warn('⚠️  JWT_SECRET não configurado. Usando fallback inseguro (apenas desenvolvimento)');
  }
  
  const jwtSecret = secret || 'your-secret-key';
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return next(new UnauthorizedError('Token inválido ou expirado'));
    }

    req.user = decoded as { id: number; email?: string };
    next();
  });
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    jwt.verify(token, secret, (err, decoded) => {
      if (!err) {
        req.user = decoded as { id: number; email?: string };
      }
    });
  }

  next();
};

