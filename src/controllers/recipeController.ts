import { Request, Response, NextFunction } from 'express';
import recipeService from '../services/recipeService';
import { CreateRecipeDto, UpdateRecipeDto } from '../types';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../shared/errors/AppError';
import { logger } from '../config/logger';

const createRecipeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    prep_time: z.number().int().positive().optional(),
    cook_time: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    image_url: z.string().url().optional(),
    ingredients: z.array(z.object({
      ingredient_id: z.number().int().positive(),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      notes: z.string().optional(),
    })).optional(),
    steps: z.array(z.object({
      step_number: z.number().int().positive(),
      instruction: z.string().min(1),
      image_url: z.string().url().optional(),
    })).optional(),
    category_ids: z.array(z.number().int().positive()).optional(),
    tag_ids: z.array(z.number().int().positive()).optional(),
  }),
});

const updateRecipeSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    prep_time: z.number().int().positive().optional(),
    cook_time: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    image_url: z.string().url().optional(),
    version_note: z.string().optional(),
  }),
});

export class RecipeController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createRecipeSchema.parse({ body: req.body }).body as CreateRecipeDto;
      logger.info('Creating recipe', { name: data.name, requestId: req.id });
      
      const recipe = await recipeService.create(data);
      
      logger.info('Recipe created', { recipeId: recipe.id, requestId: req.id });
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError('Dados inválidos', error.errors));
      }
      logger.error('Failed to create recipe', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const recipes = await recipeService.findAll(limit, offset);
      res.json(recipes);
    } catch (error) {
      logger.error('Failed to list recipes', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return next(new ValidationError('ID inválido'));
      }
      
      const recipe = await recipeService.findById(id);
      
      if (!recipe) {
        return next(new NotFoundError('Receita', id));
      }
      
      // Incrementar contador de visualização
      await recipeService.incrementViewCount(id);
      
      res.json(recipe);
    } catch (error) {
      logger.error('Failed to find recipe', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateRecipeSchema.parse({ params: req.params, body: req.body });
      const id = parsed.params.id;
      const data = parsed.body as UpdateRecipeDto;
      
      logger.info('Updating recipe', { recipeId: id, requestId: req.id });
      
      // Criar nova versão se version_note for fornecido
      const createNewVersion = !!data.version_note;
      
      const recipe = await recipeService.update(id, data, createNewVersion);
      
      if (!recipe) {
        return next(new NotFoundError('Receita', id));
      }
      
      logger.info('Recipe updated', { recipeId: id, requestId: req.id });
      res.json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError('Dados inválidos', error.errors));
      }
      logger.error('Failed to update recipe', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return next(new ValidationError('ID inválido'));
      }
      
      logger.info('Deleting recipe', { recipeId: id, requestId: req.id });
      await recipeService.delete(id);
      
      logger.info('Recipe deleted', { recipeId: id, requestId: req.id });
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete recipe', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
  
  async getTopRecipes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recipes = await recipeService.getTopRecipes(limit);
      res.json(recipes);
    } catch (error) {
      logger.error('Failed to get top recipes', { error: error instanceof Error ? error.message : String(error), requestId: req.id });
      next(error);
    }
  }
}

export default new RecipeController();

