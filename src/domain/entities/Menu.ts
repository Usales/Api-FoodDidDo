// Entidade de domínio - Menu
// Representa o cardápio no domínio de negócio

export interface MenuItem {
  recipeId: number;
  price?: number;
  displayOrder?: number;
  isAvailable?: boolean;
}

export class Menu {
  constructor(
    public id: number,
    public restaurantId: number,
    public name: string,
    public description?: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public items?: MenuItem[],
  ) {}

  static create(data: {
    restaurantId: number;
    name: string;
    description?: string;
    items?: MenuItem[];
  }): Menu {
    // Validações de negócio
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome do cardápio é obrigatório');
    }

    if (data.restaurantId <= 0) {
      throw new Error('ID do restaurante inválido');
    }

    if (data.items) {
      // Validar que não há receitas duplicadas
      const recipeIds = data.items.map(item => item.recipeId);
      const uniqueRecipeIds = new Set(recipeIds);
      if (recipeIds.length !== uniqueRecipeIds.size) {
        throw new Error('Não é possível adicionar a mesma receita duas vezes no cardápio');
      }

      // Validar preços
      for (const item of data.items) {
        if (item.price !== undefined && item.price < 0) {
          throw new Error('Preço não pode ser negativo');
        }
      }
    }

    return new Menu(
      0, // ID será gerado pelo banco
      data.restaurantId,
      data.name.trim(),
      data.description,
      true,
      new Date(),
      new Date(),
      data.items,
    );
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  update(data: {
    name?: string;
    description?: string;
    isActive?: boolean;
    items?: MenuItem[];
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Nome do cardápio não pode ser vazio');
      }
      this.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.description = data.description;
    }

    if (data.isActive !== undefined) {
      this.isActive = data.isActive;
    }

    if (data.items !== undefined) {
      // Validar receitas duplicadas
      const recipeIds = data.items.map(item => item.recipeId);
      const uniqueRecipeIds = new Set(recipeIds);
      if (recipeIds.length !== uniqueRecipeIds.size) {
        throw new Error('Não é possível adicionar a mesma receita duas vezes no cardápio');
      }

      // Validar preços
      for (const item of data.items) {
        if (item.price !== undefined && item.price < 0) {
          throw new Error('Preço não pode ser negativo');
        }
      }

      this.items = data.items;
    }

    this.updatedAt = new Date();
  }
}
