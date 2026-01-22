// Caso de uso: Criar receita
import { Recipe, Difficulty } from '../../../domain/entities/Recipe';
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository';
import { CreateRecipeDto } from '../../dto/CreateRecipeDto';
import { slugify } from '../../../utils/slugify';

export class CreateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(dto: CreateRecipeDto): Promise<Recipe> {
    // Criar entidade de domínio
    const recipe = Recipe.create({
      name: dto.name,
      description: dto.description,
      prepTime: dto.prepTime,
      cookTime: dto.cookTime,
      servings: dto.servings,
      difficulty: dto.difficulty as Difficulty,
      imageUrl: dto.imageUrl,
      ingredients: dto.ingredients,
      steps: dto.steps,
      categoryIds: dto.categoryIds,
      tagIds: dto.tagIds,
    });

    // Gerar slug
    recipe.slug = slugify(recipe.name);

    // Verificar se slug já existe
    const existingRecipe = await this.recipeRepository.findBySlug(recipe.slug);
    if (existingRecipe) {
      // Adicionar sufixo numérico se necessário
      let counter = 1;
      let newSlug = `${recipe.slug}-${counter}`;
      while (await this.recipeRepository.findBySlug(newSlug)) {
        counter++;
        newSlug = `${recipe.slug}-${counter}`;
      }
      recipe.slug = newSlug;
    }

    // Persistir
    return await this.recipeRepository.save(recipe);
  }
}
