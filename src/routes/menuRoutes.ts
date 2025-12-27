import { Router } from 'express';
import menuController from '../controllers/menuController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { cacheControl } from '../middleware/cache';

const router = Router();

// Rotas públicas (leitura de cardápio)
router.get('/restaurants/:restaurantId', cacheControl(3600), menuController.findByRestaurant.bind(menuController));
router.get('/restaurants/:restaurantId/items/:itemId', cacheControl(1800), optionalAuth, menuController.getMenuItem.bind(menuController));
router.get('/:menuId/items', cacheControl(3600), menuController.getMenuItems.bind(menuController));

// Rotas protegidas (escrita)
router.post('/', authenticateToken, menuController.create.bind(menuController));
router.put('/:id', authenticateToken, menuController.update.bind(menuController));

// Métricas (protegido)
router.get('/items/:menuItemId/metrics', authenticateToken, menuController.getMetrics.bind(menuController));

export default router;

