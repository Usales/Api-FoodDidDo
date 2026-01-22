// Entidade de domínio - Recipe
// Representa a receita no domínio de negócio

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface RecipeIngredient {
  ingredientId: number;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
}

export class Recipe {
  constructor(
    public id: number,
    public name: string,
    public slug: string,
    public description?: string,
    public prepTime?: number,
    public cookTime?: number,
    public servings?: number,
    public difficulty?: Difficulty,
    public imageUrl?: string,
    public viewCount: number = 0,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public ingredients?: RecipeIngredient[],
    public steps?: RecipeStep[],
    public categoryIds?: number[],
    public tagIds?: number[],
  ) {}

  static create(data: {
    name: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: Difficulty;
    imageUrl?: string;
    ingredients?: RecipeIngredient[];
    steps?: RecipeStep[];
    categoryIds?: number[];
    tagIds?: number[];
  }): Recipe {
    // Validações de negócio
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da receita é obrigatório');
    }

    if (data.ingredients && data.ingredients.length === 0) {
      throw new Error('Receita deve ter pelo menos um ingrediente');
    }

    if (data.prepTime && data.prepTime < 0) {
      throw new Error('Tempo de preparo não pode ser negativo');
    }

    if (data.cookTime && data.cookTime < 0) {
      throw new Error('Tempo de cozimento não pode ser negativo');
    }

    if (data.servings && data.servings <= 0) {
      throw new Error('Número de porções deve ser maior que zero');
    }

    return new Recipe(
      0, // ID será gerado pelo banco
      data.name.trim(),
      '', // Slug será gerado
      data.description,
      data.prepTime,
      data.cookTime,
      data.servings,
      data.difficulty,
      data.imageUrl,
      0,
      true,
      new Date(),
      new Date(),
      data.ingredients,
      data.steps,
      data.categoryIds,
      data.tagIds,
    );
  }

  incrementViewCount(): void {
    this.viewCount += 1;
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  update(data: {
    name?: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: Difficulty;
    imageUrl?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Nome da receita não pode ser vazio');
      }
      this.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.description = data.description;
    }

    if (data.prepTime !== undefined) {
      if (data.prepTime < 0) {
        throw new Error('Tempo de preparo não pode ser negativo');
      }
      this.prepTime = data.prepTime;
    }

    if (data.cookTime !== undefined) {
      if (data.cookTime < 0) {
        throw new Error('Tempo de cozimento não pode ser negativo');
      }
      this.cookTime = data.cookTime;
    }

    if (data.servings !== undefined) {
      if (data.servings <= 0) {
        throw new Error('Número de porções deve ser maior que zero');
      }
      this.servings = data.servings;
    }

    if (data.difficulty !== undefined) {
      this.difficulty = data.difficulty;
    }

    if (data.imageUrl !== undefined) {
      this.imageUrl = data.imageUrl;
    }

    this.updatedAt = new Date();
  }
}
