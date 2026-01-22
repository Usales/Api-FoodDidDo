// Implementação do repositório de receitas usando Prisma
import { PrismaClient } from '@prisma/client';
import { Recipe, Difficulty } from '../../../domain/entities/Recipe';
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository';
import prisma from '../prisma/client';

export class PrismaRecipeRepository implements IRecipeRepository {
  private client: PrismaClient;

  constructor() {
    this.client = prisma;
  }

  async findById(id: number): Promise<Recipe | null> {
    const data = await this.client.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findBySlug(slug: string): Promise<Recipe | null> {
    const data = await this.client.recipe.findUnique({
      where: { slug },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findAll(limit: number, offset: number): Promise<Recipe[]> {
    const data = await this.client.recipe.findMany({
      where: { isActive: true },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return data.map(item => this.mapToDomain(item));
  }

  async findTop(limit: number): Promise<Recipe[]> {
    const data = await this.client.recipe.findMany({
      where: { isActive: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return data.map(item => this.mapToDomain(item));
  }

  async save(recipe: Recipe): Promise<Recipe> {
    const result = await this.client.recipe.create({
      data: {
        name: recipe.name,
        slug: recipe.slug,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl,
        viewCount: recipe.viewCount,
        isActive: recipe.isActive,
        ingredients: recipe.ingredients ? {
          create: recipe.ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          })),
        } : undefined,
        steps: recipe.steps ? {
          create: recipe.steps.map(step => ({
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            imageUrl: step.imageUrl,
          })),
        } : undefined,
        categories: recipe.categoryIds ? {
          create: recipe.categoryIds.map(catId => ({
            categoryId: catId,
          })),
        } : undefined,
        tags: recipe.tagIds ? {
          create: recipe.tagIds.map(tagId => ({
            tagId: tagId,
          })),
        } : undefined,
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    return this.mapToDomain(result);
  }

  async update(id: number, recipe: Recipe): Promise<Recipe> {
    const result = await this.client.recipe.update({
      where: { id },
      data: {
        name: recipe.name,
        slug: recipe.slug,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl,
        isActive: recipe.isActive,
        updatedAt: new Date(),
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    return this.mapToDomain(result);
  }

  async delete(id: number): Promise<void> {
    await this.client.recipe.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.client.recipe.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  private mapToDomain(data: any): Recipe {
    return new Recipe(
      data.id,
      data.name,
      data.slug,
      data.description,
      data.prepTime,
      data.cookTime,
      data.servings,
      data.difficulty as Difficulty,
      data.imageUrl,
      data.viewCount,
      data.isActive,
      data.createdAt,
      data.updatedAt,
      data.ingredients?.map((ing: any) => ({
        ingredientId: ing.ingredientId,
        quantity: Number(ing.quantity),
        unit: ing.unit,
        notes: ing.notes,
      })),
      data.steps?.map((step: any) => ({
        stepNumber: step.stepNumber,
        instruction: step.instruction,
        imageUrl: step.imageUrl,
      })),
      data.categories?.map((cat: any) => cat.categoryId),
      data.tags?.map((tag: any) => tag.tagId),
    );
  }
}
