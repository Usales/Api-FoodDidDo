# 🛠️ Guia de Implementação - Melhorias API FoodDidDo

Este documento fornece exemplos práticos de código para implementar as melhorias priorizadas.

---

## 1. VERSIONAMENTO DE API

### Estrutura de Pastas

```
src/
├── routes/
│   ├── v1/
│   │   ├── recipeRoutes.ts
│   │   └── menuRoutes.ts
│   └── v2/
│       └── recipeRoutes.ts (futuro)
```

### Implementação

```typescript
// src/index.ts
import recipeRoutesV1 from './routes/v1/recipeRoutes';
import menuRoutesV1 from './routes/v1/menuRoutes';

// Versionamento explícito
app.use('/api/v1/recipes', recipeRoutesV1);
app.use('/api/v1/menus', menuRoutesV1);

// Health check sem versão
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});
```

### Middleware de Versionamento

```typescript
// src/middleware/version.ts
import { Request, Response, NextFunction } from 'express';

export const requireVersion = (minVersion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = req.headers['api-version'] || '1.0.0';
    
    if (compareVersions(apiVersion, minVersion) < 0) {
      return res.status(426).json({
        error: {
          code: 'UPGRADE_REQUIRED',
          message: `Versão mínima da API: ${minVersion}`,
          currentVersion: apiVersion,
        },
      });
    }
    
    next();
  };
};
```

---

## 2. PADRONIZAÇÃO DE ERROS

### Classes de Erro Customizadas

```typescript
// src/shared/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(404, 'NOT_FOUND', `${resource} não encontrado${id ? `: ${id}` : ''}`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, 'CONFLICT', message, details);
  }
}
```

### Error Handler Centralizado

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log do erro (estruturado)
  const logger = req.app.get('logger');
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
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
    },
  });
};
```

### Uso nos Controllers

```typescript
// src/controllers/recipeController.ts
import { NotFoundError, ValidationError } from '../shared/errors/AppError';

export class RecipeController {
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID inválido');
      }

      const recipe = await recipeService.findById(id);
      
      if (!recipe) {
        throw new NotFoundError('Receita', id);
      }

      res.json(recipe);
    } catch (error) {
      next(error); // Passa para error handler
    }
  }
}
```

---

## 3. LOGGING ESTRUTURADO

### Configuração do Logger (Winston)

```typescript
// src/config/logger.ts
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'api-fooddiddo' },
  transports: [
    // Console (desenvolvimento)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Arquivo de erros
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Arquivo geral
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// Em produção, adicionar transporte para serviço externo
if (process.env.NODE_ENV === 'production') {
  // Exemplo: CloudWatch, Datadog, etc.
}
```

### Middleware de Request Logging

```typescript
// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = randomUUID();
  req.id = requestId; // Adicionar ao request

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
```

### Uso no Código

```typescript
// src/services/recipeService.ts
import { logger } from '../config/logger';

export class RecipeService {
  async create(data: CreateRecipeDto): Promise<Recipe> {
    logger.info('Creating recipe', { name: data.name });
    
    try {
      // ... lógica
      logger.info('Recipe created', { recipeId: recipe.id });
      return recipe;
    } catch (error) {
      logger.error('Failed to create recipe', {
        error: error.message,
        data: { name: data.name },
      });
      throw error;
    }
  }
}
```

---

## 4. AUTENTICAÇÃO ROBUSTA

### Refresh Tokens

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/AppError';
import { redisClient } from '../config/redis';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new UnauthorizedError('Token de acesso requerido');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  // Verificar se token está na blacklist
  const isBlacklisted = await redisClient.get(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new UnauthorizedError('Token inválido');
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expirado');
    }
    throw new UnauthorizedError('Token inválido');
  }
};

// RBAC (Role-Based Access Control)
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requer uma das roles: ${roles.join(', ')}`);
    }

    next();
  };
};

// Logout (adicionar token à blacklist)
export const logout = async (token: string): Promise<void> => {
  const decoded = jwt.decode(token) as { exp?: number };
  if (decoded?.exp) {
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.setex(`blacklist:${token}`, ttl, '1');
  }
};
```

### Geração de Tokens

```typescript
// src/services/authService.ts
import jwt from 'jsonwebtoken';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  generateTokens(userId: number, email: string, role: string): TokenPair {
    const secret = process.env.JWT_SECRET!;
    const refreshSecret = process.env.JWT_REFRESH_SECRET!;

    const accessToken = jwt.sign(
      { id: userId, email, role },
      secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      refreshSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET!;
    
    const decoded = jwt.verify(refreshToken, refreshSecret) as {
      id: number;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Token inválido');
    }

    // Buscar usuário e gerar novo access token
    const user = await userService.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    const secret = process.env.JWT_SECRET!;
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '15m' }
    );
  }
}
```

---

## 5. VALIDAÇÃO CENTRALIZADA

### Schemas Zod Reutilizáveis

```typescript
// src/validators/recipeValidators.ts
import { z } from 'zod';

export const createRecipeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    prep_time: z.number().int().positive().max(1440).optional(), // max 24h
    cook_time: z.number().int().positive().max(1440).optional(),
    servings: z.number().int().positive().max(1000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    image_url: z.string().url().max(500).optional(),
    ingredients: z.array(z.object({
      ingredient_id: z.number().int().positive(),
      quantity: z.number().positive(),
      unit: z.string().min(1).max(50),
      notes: z.string().max(500).optional(),
    })).max(100).optional(),
    steps: z.array(z.object({
      step_number: z.number().int().positive(),
      instruction: z.string().min(1).max(2000),
      image_url: z.string().url().max(500).optional(),
    })).max(100).optional(),
    category_ids: z.array(z.number().int().positive()).max(10).optional(),
    tag_ids: z.array(z.number().int().positive()).max(20).optional(),
  }),
});

export const updateRecipeSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    // ... outros campos opcionais
  }),
});
```

### Middleware de Validação

```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../shared/errors/AppError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Substituir req.body/query/params pelos valores validados
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Dados inválidos', error.errors);
      }
      next(error);
    }
  };
};
```

### Uso nas Rotas

```typescript
// src/routes/v1/recipeRoutes.ts
import { Router } from 'express';
import { validate } from '../../middleware/validation';
import { createRecipeSchema, updateRecipeSchema } from '../../validators/recipeValidators';

router.post(
  '/',
  authenticateToken,
  validate(createRecipeSchema),
  recipeController.create.bind(recipeController)
);
```

---

## 6. CACHE COM REDIS

### Configuração do Redis

```typescript
// src/config/redis.ts
import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().catch(console.error);
```

### Cache Middleware

```typescript
// src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { createHash } from 'crypto';

export const cacheMiddleware = (ttl: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Apenas cache para GET
    if (req.method !== 'GET') {
      return next();
    }

    // Gerar chave de cache baseada na URL e query params
    const cacheKey = `cache:${req.path}:${JSON.stringify(req.query)}`;

    try {
      // Tentar buscar do cache
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        res.json(data);
        return;
      }

      // Interceptar resposta para cachear
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Cachear resposta
        redisClient.setEx(cacheKey, ttl, JSON.stringify(body)).catch(console.error);
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Se Redis falhar, continuar sem cache
      console.error('Cache error:', error);
      next();
    }
  };
};

// Invalidação de cache
export const invalidateCache = async (pattern: string): Promise<void> => {
  const keys = await redisClient.keys(`cache:${pattern}*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
```

### Uso nas Rotas

```typescript
// src/routes/v1/recipeRoutes.ts
import { cacheMiddleware } from '../../middleware/cache';

router.get('/', cacheMiddleware(3600), recipeController.findAll);
router.get('/:id', cacheMiddleware(1800), recipeController.findById);
```

### Invalidação em Updates

```typescript
// src/services/recipeService.ts
import { invalidateCache } from '../middleware/cache';

export class RecipeService {
  async update(id: number, data: UpdateRecipeDto): Promise<Recipe> {
    // ... lógica de update
    
    // Invalidar cache
    await invalidateCache(`/api/v1/recipes/${id}`);
    await invalidateCache('/api/v1/recipes');
    
    return recipe;
  }
}
```

---

## 7. CLEAN ARCHITECTURE - ESTRUTURA

### Estrutura de Pastas Proposta

```
src/
├── domain/                    # Camada de Domínio
│   ├── entities/              # Entidades de negócio
│   │   ├── Recipe.ts
│   │   └── Menu.ts
│   ├── repositories/           # Interfaces de repositórios
│   │   ├── IRecipeRepository.ts
│   │   └── IMenuRepository.ts
│   └── services/              # Interfaces de serviços
│       └── IRecipeService.ts
│
├── application/                # Camada de Aplicação
│   ├── use-cases/             # Casos de uso
│   │   ├── recipes/
│   │   │   ├── CreateRecipeUseCase.ts
│   │   │   └── UpdateRecipeUseCase.ts
│   │   └── menus/
│   └── dto/                    # DTOs de aplicação
│       ├── CreateRecipeDto.ts
│       └── UpdateRecipeDto.ts
│
├── infrastructure/              # Camada de Infraestrutura
│   ├── database/              # Implementações de repositórios
│   │   ├── PrismaRecipeRepository.ts
│   │   └── PrismaMenuRepository.ts
│   ├── cache/                 # Implementação de cache
│   └── external/              # APIs externas
│
└── presentation/               # Camada de Apresentação
    ├── controllers/           # Controllers HTTP
    ├── routes/                # Rotas
    ├── middleware/            # Middlewares
    └── validators/            # Validadores
```

### Exemplo: Use Case

```typescript
// src/application/use-cases/recipes/CreateRecipeUseCase.ts
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository';
import { CreateRecipeDto } from '../../dto/CreateRecipeDto';
import { Recipe } from '../../../domain/entities/Recipe';

export class CreateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(dto: CreateRecipeDto): Promise<Recipe> {
    // Validações de negócio
    if (dto.ingredients && dto.ingredients.length === 0) {
      throw new Error('Receita deve ter pelo menos um ingrediente');
    }

    // Criar entidade
    const recipe = Recipe.create(dto);

    // Persistir
    return await this.recipeRepository.save(recipe);
  }
}
```

### Exemplo: Repository Interface

```typescript
// src/domain/repositories/IRecipeRepository.ts
import { Recipe } from '../entities/Recipe';

export interface IRecipeRepository {
  findById(id: number): Promise<Recipe | null>;
  findAll(limit: number, offset: number): Promise<Recipe[]>;
  save(recipe: Recipe): Promise<Recipe>;
  update(id: number, recipe: Recipe): Promise<Recipe>;
  delete(id: number): Promise<void>;
}
```

---

## 8. HEALTH CHECKS GRANULARES

```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { redisClient } from '../config/redis';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      // Adicionar outros checks (external APIs, etc.)
    },
  };

  const allHealthy = Object.values(checks.checks).every(
    (check) => check.status === 'ok'
  );

  res.status(allHealthy ? 200 : 503).json(checks);
});

async function checkDatabase(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

async function checkCache(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    await redisClient.ping();
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

export default router;
```

---

## 9. OPENAPI/SWAGGER

### Configuração

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodDidDo API',
      version: '1.0.0',
      description: 'API RESTful para cardápio digital e gestão de receitas',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
```

### Documentação de Endpoints

```typescript
// src/routes/v1/recipeRoutes.ts
/**
 * @swagger
 * /api/v1/recipes:
 *   get:
 *     summary: Listar receitas
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de receitas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 */
router.get('/', recipeController.findAll);
```

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS

```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "redis": "^4.6.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/swagger-jsdoc": "^6.0.1",
    "@types/swagger-ui-express": "^4.1.6"
  }
}
```

---

## 🚀 PRÓXIMOS PASSOS

1. Implementar Quick Wins primeiro
2. Configurar ambiente de desenvolvimento (Redis, etc.)
3. Adicionar testes para cada melhoria
4. Documentar mudanças no CHANGELOG
5. Medir impacto antes/depois

---

**Última atualização:** Janeiro 2025
