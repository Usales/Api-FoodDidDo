import pool from '../config/database';
import { Menu, MenuItem, CreateMenuDto, UpdateMenuDto } from '../types';

export class MenuService {
  async create(data: CreateMenuDto): Promise<Menu> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const menuResult = await client.query(
        `INSERT INTO menus (restaurant_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.restaurant_id, data.name, data.description || null]
      );
      
      const menu = menuResult.rows[0];
      
      // Adicionar itens do cardápio
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await client.query(
            `INSERT INTO menu_items (menu_id, recipe_id, price, display_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (menu_id, recipe_id) DO NOTHING`,
            [
              menu.id,
              item.recipe_id,
              item.price || null,
              item.display_order || 0,
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return await this.findById(menu.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async findById(id: number): Promise<Menu | null> {
    const result = await pool.query(
      `SELECT m.*, r.name as restaurant_name, r.slug as restaurant_slug
       FROM menus m
       JOIN restaurants r ON m.restaurant_id = r.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
  
  async findByRestaurant(restaurantId: number): Promise<Menu[]> {
    const result = await pool.query(
      'SELECT * FROM menus WHERE restaurant_id = $1 AND is_active = true ORDER BY created_at DESC',
      [restaurantId]
    );
    return result.rows;
  }
  
  async getMenuItems(menuId: number): Promise<MenuItem[]> {
    const result = await pool.query(
      `SELECT mi.*, r.name as recipe_name, r.slug as recipe_slug, r.image_url as recipe_image,
              r.description as recipe_description
       FROM menu_items mi
       JOIN recipes r ON mi.recipe_id = r.id
       WHERE mi.menu_id = $1 AND mi.is_available = true
       ORDER BY mi.display_order ASC, mi.created_at ASC`,
      [menuId]
    );
    return result.rows;
  }
  
  async update(id: number, data: UpdateMenuDto): Promise<Menu> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;
      
      if (data.name) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(data.name);
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(data.description);
      }
      if (data.is_active !== undefined) {
        updateFields.push(`is_active = $${paramCount++}`);
        updateValues.push(data.is_active);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);
      
      if (updateFields.length > 1) {
        await client.query(
          `UPDATE menus SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
          updateValues
        );
      }
      
      // Atualizar itens se fornecidos
      if (data.items) {
        // Remover itens não listados (opcional - pode ser feito de forma mais sofisticada)
        // Por simplicidade, vamos apenas atualizar/adicionar os itens fornecidos
        for (const item of data.items) {
          await client.query(
            `INSERT INTO menu_items (menu_id, recipe_id, price, display_order, is_available)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (menu_id, recipe_id)
             DO UPDATE SET price = EXCLUDED.price, display_order = EXCLUDED.display_order, 
                          is_available = EXCLUDED.is_available, updated_at = CURRENT_TIMESTAMP`,
            [
              id,
              item.recipe_id,
              item.price || null,
              item.display_order || 0,
              item.is_available !== undefined ? item.is_available : true,
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async recordMenuItemView(menuItemId: number, recipeId: number, restaurantId: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Incrementar contador do item do cardápio
      await client.query(
        'UPDATE menu_items SET view_count = view_count + 1 WHERE id = $1',
        [menuItemId]
      );
      
      // Incrementar contador da receita
      await client.query(
        'UPDATE recipes SET view_count = view_count + 1 WHERE id = $1',
        [recipeId]
      );
      
      // Registrar métrica diária
      const today = new Date().toISOString().split('T')[0];
      await client.query(
        `INSERT INTO menu_item_metrics (menu_item_id, recipe_id, restaurant_id, access_date, view_count)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (menu_item_id, access_date)
         DO UPDATE SET view_count = menu_item_metrics.view_count + 1`,
        [menuItemId, recipeId, restaurantId, today]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getMenuItemMetrics(menuItemId: number, startDate?: Date, endDate?: Date) {
    let query = `
      SELECT access_date, view_count, recipe_id, restaurant_id
      FROM menu_item_metrics
      WHERE menu_item_id = $1
    `;
    const params: any[] = [menuItemId];
    
    if (startDate) {
      query += ` AND access_date >= $${params.length + 1}`;
      params.push(startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      query += ` AND access_date <= $${params.length + 1}`;
      params.push(endDate.toISOString().split('T')[0]);
    }
    
    query += ' ORDER BY access_date DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default new MenuService();

