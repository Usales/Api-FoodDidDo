// Interface do repositório de cardápios
// Define o contrato para acesso a dados de cardápios

import { Menu } from '../entities/Menu';

export interface IMenuRepository {
  findById(id: number): Promise<Menu | null>;
  findByRestaurant(restaurantId: number): Promise<Menu[]>;
  findMenuItems(menuId: number): Promise<any[]>;
  save(menu: Menu): Promise<Menu>;
  update(id: number, menu: Menu): Promise<Menu>;
  recordMenuItemView(menuItemId: number, recipeId: number, restaurantId: number): Promise<void>;
  getMenuItemMetrics(menuItemId: number, startDate?: Date, endDate?: Date): Promise<any[]>;
}
