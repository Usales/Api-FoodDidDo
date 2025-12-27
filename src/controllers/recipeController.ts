import { Request, Response } from 'express';
import recipeService from '../services/recipeService';
import { CreateRecipeDto, UpdateRecipeDto } from '../types';
import { z } from 'zod';

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
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = createRecipeSchema.parse({ body: req.body }).body as CreateRecipeDto;
      const recipe = await recipeService.create(data);
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Dados inválidos', details: error.errors });
        return;
      }
      console.error('Erro ao criar receita:', error);
      res.status(500).json({ error: 'Erro ao criar receita' });
    }
  }
  
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const recipes = await recipeService.findAll(limit, offset);
      res.json(recipes);
    } catch (error) {
      console.error('Erro ao listar receitas:', error);
      res.status(500).json({ error: 'Erro ao listar receitas' });
    }
  }
  
  async findById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const recipe = await recipeService.findById(id);
      
      if (!recipe) {
        res.status(404).json({ error: 'Receita não encontrada' });
        return;
      }
      
      // Incrementar contador de visualização
      await recipeService.incrementViewCount(id);
      
      res.json(recipe);
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      res.status(500).json({ error: 'Erro ao buscar receita' });
    }
  }
  
  async update(req: Request, res: Response): Promise<void> {
    try {
      const parsed = updateRecipeSchema.parse({ params: req.params, body: req.body });
      const id = parsed.params.id;
      const data = parsed.body as UpdateRecipeDto;
      
      // Criar nova versão se version_note for fornecido
      const createNewVersion = !!data.version_note;
      
      const recipe = await recipeService.update(id, data, createNewVersion);
      
      if (!recipe) {
        res.status(404).json({ error: 'Receita não encontrada' });
        return;
      }
      
      res.json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Dados inválidos', details: error.errors });
        return;
      }
      console.error('Erro ao atualizar receita:', error);
      res.status(500).json({ error: 'Erro ao atualizar receita' });
    }
  }
  
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await recipeService.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar receita:', error);
      res.status(500).json({ error: 'Erro ao deletar receita' });
    }
  }
  
  async getTopRecipes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recipes = await recipeService.getTopRecipes(limit);
      res.json(recipes);
    } catch (error) {
      console.error('Erro ao buscar receitas mais visualizadas:', error);
      res.status(500).json({ error: 'Erro ao buscar receitas mais visualizadas' });
    }
  }
}

export default new RecipeController();

