-- Migration: Adicionar índices para otimização de performance
-- Data: 2025-01-22
-- Descrição: Índices para melhorar performance de queries frequentes

-- Índices para tabela recipes
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_is_active ON recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_recipes_view_count ON recipes(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Índices para tabela menu_items
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_recipe_id ON menu_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_display_order ON menu_items(display_order);

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_available ON menu_items(menu_id, is_available);
CREATE INDEX IF NOT EXISTS idx_recipes_active_view_count ON recipes(is_active, view_count DESC);

-- Índices para tabela menus
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_active ON menus(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active);

-- Índices para tabela recipe_versions
CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe_id ON recipe_versions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_is_current ON recipe_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe_current ON recipe_versions(recipe_id, is_current);

-- Índices para tabela menu_item_metrics
CREATE INDEX IF NOT EXISTS idx_menu_item_metrics_menu_item_id ON menu_item_metrics(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_metrics_access_date ON menu_item_metrics(access_date DESC);
CREATE INDEX IF NOT EXISTS idx_menu_item_metrics_menu_item_date ON menu_item_metrics(menu_item_id, access_date DESC);

-- Índices para tabela recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_version ON recipe_ingredients(recipe_id, recipe_version_id);

-- Índices para tabela recipe_steps
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_version ON recipe_steps(recipe_id, recipe_version_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_step_number ON recipe_steps(recipe_id, step_number);

-- Índices para tabelas de relacionamento
CREATE INDEX IF NOT EXISTS idx_recipe_categories_recipe_id ON recipe_categories(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_categories_category_id ON recipe_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);
