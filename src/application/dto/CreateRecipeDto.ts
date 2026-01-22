// DTO para criação de receita
export interface CreateRecipeDto {
  name: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  ingredients?: Array<{
    ingredientId: number;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  steps?: Array<{
    stepNumber: number;
    instruction: string;
    imageUrl?: string;
  }>;
  categoryIds?: number[];
  tagIds?: number[];
}
