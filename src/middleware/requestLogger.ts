import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

// Estender Request para incluir ID e logger
declare global {
  namespace Express {
    interface Request {
      id?: string;
      logger?: typeof logger;
    }
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = randomUUID();
  req.id = requestId;
  req.logger = logger;

  const startTime = Date.now();

  // Log da requisição
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log da resposta ao finalizar
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
