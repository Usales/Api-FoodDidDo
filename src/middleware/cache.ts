import { Request, Response, NextFunction } from 'express';

// Middleware simples para preparar cache HTTP
// Em produção, usar Redis ou similar
export const cacheControl = (maxAge: number = 3600) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Apenas cache para métodos GET
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
      res.set('ETag', `"${Date.now()}"`);
    }
    next();
  };
};

export const checkCache = (req: Request, res: Response, next: NextFunction): void => {
  const ifNoneMatch = req.headers['if-none-match'];
  const etag = res.get('ETag');

  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    res.status(304).end();
    return;
  }

  next();
};

