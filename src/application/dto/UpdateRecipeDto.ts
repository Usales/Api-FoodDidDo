// DTO para atualização de receita
export interface UpdateRecipeDto {
  name?: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  versionNote?: string; // Se fornecido, cria nova versão
}
