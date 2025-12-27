// Tipos TypeScript para a API

export interface Recipe {
  id: number;
  name: string;
  slug: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
  view_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RecipeVersion {
  id: number;
  recipe_id: number;
  version_number: number;
  name: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: Date;
  created_by?: number;
  is_current: boolean;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  created_at: Date;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  recipe_version_id?: number;
  ingredient_id: number;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient?: Ingredient;
}

export interface RecipeStep {
  id: number;
  recipe_id: number;
  recipe_version_id?: number;
  step_number: number;
  instruction: string;
  image_url?: string;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Menu {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  restaurant?: Restaurant;
}

export interface MenuItem {
  id: number;
  menu_id: number;
  recipe_id: number;
  price?: number;
  display_order: number;
  is_available: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
  recipe?: Recipe;
  menu?: Menu;
}

export interface MenuItemMetric {
  id: number;
  menu_item_id: number;
  recipe_id: number;
  restaurant_id: number;
  access_date: Date;
  view_count: number;
  created_at: Date;
}

export interface CreateRecipeDto {
  name: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
  ingredients?: Array<{
    ingredient_id: number;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  steps?: Array<{
    step_number: number;
    instruction: string;
    image_url?: string;
  }>;
  category_ids?: number[];
  tag_ids?: number[];
}

export interface UpdateRecipeDto extends Partial<CreateRecipeDto> {
  version_note?: string;
}

export interface CreateMenuDto {
  restaurant_id: number;
  name: string;
  description?: string;
  items?: Array<{
    recipe_id: number;
    price?: number;
    display_order?: number;
  }>;
}

export interface UpdateMenuDto {
  name?: string;
  description?: string;
  is_active?: boolean;
  items?: Array<{
    recipe_id: number;
    price?: number;
    display_order?: number;
    is_available?: boolean;
  }>;
}

