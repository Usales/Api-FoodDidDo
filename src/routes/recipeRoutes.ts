import { Router } from 'express';
import recipeController from '../controllers/recipeController';
import { authenticateToken } from '../middleware/auth';
import { cacheControl } from '../middleware/cache';

const router = Router();

// Rotas públicas (leitura)
router.get('/', cacheControl(3600), recipeController.findAll.bind(recipeController));
router.get('/top', cacheControl(3600), recipeController.getTopRecipes.bind(recipeController));
router.get('/:id', cacheControl(3600), recipeController.findById.bind(recipeController));

// Rotas protegidas (escrita)
router.post('/', authenticateToken, recipeController.create.bind(recipeController));
router.put('/:id', authenticateToken, recipeController.update.bind(recipeController));
router.delete('/:id', authenticateToken, recipeController.delete.bind(recipeController));

export default router;

