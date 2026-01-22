import { Request, Response, NextFunction } from 'express';
import menuService from '../services/menuService';
import { CreateMenuDto, UpdateMenuDto } from '../types';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../shared/errors/AppError';
import { logger } from '../config/logger';

const createMenuSchema = z.object({
  body: z.object({
    restaurant_id: z.number().int().positive(),
    name: z.string().min(1),
    description: z.string().optional(),
    items: z.array(z.object({
      recipe_id: z.number().int().positive(),
      price: z.number().positive().optional(),
      display_order: z.number().int().nonnegative().optional(),
    })).optional(),
  }),
});

export class MenuController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createMenuSchema.parse({ body: req.body }).body as CreateMenuDto;
      logger.info('Creating menu', { name: data.name, restaurantId: data.restaurant_id, requestId: req.id });
      
      const menu = await menuService.create(data);
      
      logger.info('Menu created', { menuId: menu.id, requestId: req.id });
      res.status(201).json(menu);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError('Dados inválidos', error.errors));
      }
      logger.error('Failed to create menu', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async findByRestaurant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return next(new ValidationError('ID do restaurante inválido'));
      }
      
      const menus = await menuService.findByRestaurant(restaurantId);
      res.json(menus);
    } catch (error) {
      logger.error('Failed to find menus by restaurant', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async getMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menuId = parseInt(req.params.menuId);
      if (isNaN(menuId)) {
        return next(new ValidationError('ID do cardápio inválido'));
      }
      
      const items = await menuService.getMenuItems(menuId);
      res.json(items);
    } catch (error) {
      logger.error('Failed to get menu items', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async getMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const itemId = parseInt(req.params.itemId);
      
      if (isNaN(restaurantId) || isNaN(itemId)) {
        return next(new ValidationError('IDs inválidos'));
      }
      
      // Buscar item do cardápio
      const result = await menuService.getMenuItems(itemId);
      const item = result.find(i => i.id === itemId);
      
      if (!item) {
        return next(new NotFoundError('Item do cardápio', itemId));
      }
      
      // Registrar visualização
      await menuService.recordMenuItemView(itemId, item.recipe_id, restaurantId);
      
      res.json(item);
    } catch (error) {
      logger.error('Failed to get menu item', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return next(new ValidationError('ID inválido'));
      }
      
      const data = req.body as UpdateMenuDto;
      logger.info('Updating menu', { menuId: id, requestId: req.id });
      
      const menu = await menuService.update(id, data);
      
      if (!menu) {
        return next(new NotFoundError('Cardápio', id));
      }
      
      logger.info('Menu updated', { menuId: id, requestId: req.id });
      res.json(menu);
    } catch (error) {
      logger.error('Failed to update menu', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menuItemId = parseInt(req.params.menuItemId);
      if (isNaN(menuItemId)) {
        return next(new ValidationError('ID do item inválido'));
      }
      
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const metrics = await menuService.getMenuItemMetrics(menuItemId, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get metrics', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
}

export default new MenuController();

