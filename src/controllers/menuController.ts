import { Request, Response } from 'express';
import menuService from '../services/menuService';
import { CreateMenuDto, UpdateMenuDto } from '../types';
import { z } from 'zod';

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
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = createMenuSchema.parse({ body: req.body }).body as CreateMenuDto;
      const menu = await menuService.create(data);
      res.status(201).json(menu);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Dados inválidos', details: error.errors });
        return;
      }
      console.error('Erro ao criar cardápio:', error);
      res.status(500).json({ error: 'Erro ao criar cardápio' });
    }
  }
  
  async findByRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const menus = await menuService.findByRestaurant(restaurantId);
      res.json(menus);
    } catch (error) {
      console.error('Erro ao buscar cardápios:', error);
      res.status(500).json({ error: 'Erro ao buscar cardápios' });
    }
  }
  
  async getMenuItems(req: Request, res: Response): Promise<void> {
    try {
      const menuId = parseInt(req.params.menuId);
      const items = await menuService.getMenuItems(menuId);
      res.json(items);
    } catch (error) {
      console.error('Erro ao buscar itens do cardápio:', error);
      res.status(500).json({ error: 'Erro ao buscar itens do cardápio' });
    }
  }
  
  async getMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const itemId = parseInt(req.params.itemId);
      
      // Buscar item do cardápio
      const result = await menuService.getMenuItems(itemId);
      const item = result.find(i => i.id === itemId);
      
      if (!item) {
        res.status(404).json({ error: 'Item não encontrado' });
        return;
      }
      
      // Registrar visualização
      await menuService.recordMenuItemView(itemId, item.recipe_id, restaurantId);
      
      res.json(item);
    } catch (error) {
      console.error('Erro ao buscar item do cardápio:', error);
      res.status(500).json({ error: 'Erro ao buscar item do cardápio' });
    }
  }
  
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data = req.body as UpdateMenuDto;
      const menu = await menuService.update(id, data);
      
      if (!menu) {
        res.status(404).json({ error: 'Cardápio não encontrado' });
        return;
      }
      
      res.json(menu);
    } catch (error) {
      console.error('Erro ao atualizar cardápio:', error);
      res.status(500).json({ error: 'Erro ao atualizar cardápio' });
    }
  }
  
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const menuItemId = parseInt(req.params.menuItemId);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const metrics = await menuService.getMenuItemMetrics(menuItemId, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      res.status(500).json({ error: 'Erro ao buscar métricas' });
    }
  }
}

export default new MenuController();

