// Caso de uso: Atualizar receita
import { Recipe, Difficulty } from '../../../domain/entities/Recipe';
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository';
import { UpdateRecipeDto } from '../../dto/UpdateRecipeDto';
import { NotFoundError } from '../../../shared/errors/AppError';
import { slugify } from '../../../utils/slugify';

export class UpdateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(id: number, dto: UpdateRecipeDto, createNewVersion: boolean = false): Promise<Recipe> {
    // Buscar receita existente
    const existingRecipe = await this.recipeRepository.findById(id);
    if (!existingRecipe) {
      throw new NotFoundError('Receita', id);
    }

    // Atualizar entidade de domínio
    existingRecipe.update({
      name: dto.name,
      description: dto.description,
      prepTime: dto.prepTime,
      cookTime: dto.cookTime,
      servings: dto.servings,
      difficulty: dto.difficulty as Difficulty,
      imageUrl: dto.imageUrl,
    });

    // Atualizar slug se nome mudou
    if (dto.name) {
      const newSlug = slugify(dto.name);
      if (newSlug !== existingRecipe.slug) {
        // Verificar se novo slug já existe
        const recipeWithSlug = await this.recipeRepository.findBySlug(newSlug);
        if (recipeWithSlug && recipeWithSlug.id !== id) {
          // Slug já existe para outra receita
          let counter = 1;
          let finalSlug = `${newSlug}-${counter}`;
          while (await this.recipeRepository.findBySlug(finalSlug)) {
            counter++;
            finalSlug = `${newSlug}-${counter}`;
          }
          existingRecipe.slug = finalSlug;
        } else {
          existingRecipe.slug = newSlug;
        }
      }
    }

    // Persistir atualização
    return await this.recipeRepository.update(id, existingRecipe);
  }
}
