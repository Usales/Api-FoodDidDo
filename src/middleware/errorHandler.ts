import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log do erro (será melhorado com logger estruturado)
  const logger = (req as any).logger || console;
  
  logger.error('Request error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Erro conhecido (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  // Erro de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: err.errors,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  // Erro desconhecido
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? err.message : 'Erro interno do servidor',
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};
