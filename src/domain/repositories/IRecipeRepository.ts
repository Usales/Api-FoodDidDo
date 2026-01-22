// Interface do repositório de receitas
// Define o contrato para acesso a dados de receitas

import { Recipe } from '../entities/Recipe';

export interface IRecipeRepository {
  findById(id: number): Promise<Recipe | null>;
  findBySlug(slug: string): Promise<Recipe | null>;
  findAll(limit: number, offset: number): Promise<Recipe[]>;
  findTop(limit: number): Promise<Recipe[]>;
  save(recipe: Recipe): Promise<Recipe>;
  update(id: number, recipe: Recipe): Promise<Recipe>;
  delete(id: number): Promise<void>;
  incrementViewCount(id: number): Promise<void>;
}
