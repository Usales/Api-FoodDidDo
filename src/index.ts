import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import recipeRoutesV1 from './routes/v1/recipeRoutes';
import menuRoutesV1 from './routes/v1/menuRoutes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { NotFoundError } from './shared/errors/AppError';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Validar variáveis de ambiente críticas em produção
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET é obrigatório em produção');
    process.exit(1);
  }
}

// Middlewares de segurança
app.use(helmet());
app.use(compression());

// CORS - Corrigido para não usar '*' com credentials
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc) em desenvolvimento
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Se não há origens configuradas, permitir todas (apenas desenvolvimento)
    if (corsOrigins.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('⚠️  CORS_ORIGINS não configurado em produção');
      }
      return callback(null, true);
    }
    
    if (origin && corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: corsOrigins.length > 0, // Só permite credentials se houver origens específicas
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições deste IP, tente novamente mais tarde.',
        timestamp: new Date().toISOString(),
      },
    });
  },
});
app.use('/api/', limiter);

// Request logging (deve vir antes das rotas)
app.use(requestLogger);

// Body parser com limite de tamanho
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rotas da API - Versionadas
app.use('/api/v1/recipes', recipeRoutesV1);
app.use('/api/v1/menus', menuRoutesV1);

// Compatibilidade com rotas antigas (redirecionar para v1)
app.use('/api/recipes', recipeRoutesV1);
app.use('/api/menus', menuRoutesV1);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError('Rota', req.path));
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info('Servidor iniciado', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
    apiVersion: 'v1',
  });
});

export default app;

