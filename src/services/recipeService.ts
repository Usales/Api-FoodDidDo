import pool from '../config/database';
import { Recipe, RecipeVersion, CreateRecipeDto, UpdateRecipeDto } from '../types';
import { slugify } from '../utils/slugify';

export class RecipeService {
  async create(data: CreateRecipeDto): Promise<Recipe> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const slug = slugify(data.name);
      
      // Criar receita
      const recipeResult = await client.query(
        `INSERT INTO recipes (name, slug, description, prep_time, cook_time, servings, difficulty, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ${useSQLite ? '' : 'RETURNING *'}`,
        [
          data.name,
          slug,
          data.description || null,
          data.prep_time || null,
          data.cook_time || null,
          data.servings || null,
          data.difficulty || null,
          data.image_url || null,
        ]
      );
      
      // Para SQLite, buscar o registro inserido
      let recipe;
      if (recipeResult.insertId) {
        const selectResult = await client.query(
          'SELECT * FROM recipes WHERE id = $1',
          [recipeResult.insertId]
        );
        recipe = selectResult.rows[0];
      } else {
        recipe = recipeResult.rows[0];
      }
      
      // Criar versão inicial
      const versionResult = await client.query(
        `INSERT INTO recipe_versions (recipe_id, version_number, name, description, prep_time, cook_time, servings, difficulty, is_current)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, true)
         RETURNING *`,
        [
          recipe.id,
          data.name,
          data.description || null,
          data.prep_time || null,
          data.cook_time || null,
          data.servings || null,
          data.difficulty || null,
        ]
      );
      
      // Para SQLite, buscar a versão inserida
      let version;
      if (versionResult.insertId) {
        const selectVersion = await client.query(
          'SELECT * FROM recipe_versions WHERE id = $1',
          [versionResult.insertId]
        );
        version = selectVersion.rows[0];
      } else {
        version = versionResult.rows[0];
      }
      
      // Adicionar ingredientes
      if (data.ingredients && data.ingredients.length > 0) {
        for (const ing of data.ingredients) {
          await client.query(
            `INSERT INTO recipe_ingredients (recipe_id, recipe_version_id, ingredient_id, quantity, unit, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              recipe.id,
              version.id,
              ing.ingredient_id,
              ing.quantity,
              ing.unit,
              ing.notes || null,
            ]
          );
        }
      }
      
      // Adicionar passos
      if (data.steps && data.steps.length > 0) {
        for (const step of data.steps) {
          await client.query(
            `INSERT INTO recipe_steps (recipe_id, recipe_version_id, step_number, instruction, image_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              recipe.id,
              version.id,
              step.step_number,
              step.instruction,
              step.image_url || null,
            ]
          );
        }
      }
      
      // Adicionar categorias
      if (data.category_ids && data.category_ids.length > 0) {
        for (const catId of data.category_ids) {
          await client.query(
            `INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [recipe.id, catId]
          );
        }
      }
      
      // Adicionar tags
      if (data.tag_ids && data.tag_ids.length > 0) {
        for (const tagId of data.tag_ids) {
          await client.query(
            `INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [recipe.id, tagId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return await this.findById(recipe.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async findById(id: number): Promise<Recipe | null> {
    const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
  
  async findAll(limit: number = 50, offset: number = 0): Promise<Recipe[]> {
    const result = await pool.query(
      'SELECT * FROM recipes WHERE is_active = true ORDER BY view_count DESC, created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
  
  async update(id: number, data: UpdateRecipeDto, createNewVersion: boolean = false): Promise<Recipe> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const recipe = await this.findById(id);
      if (!recipe) {
        throw new Error('Receita não encontrada');
      }
      
      if (createNewVersion) {
        // Buscar última versão
        const lastVersionResult = await client.query(
          'SELECT MAX(version_number) as max_version FROM recipe_versions WHERE recipe_id = $1',
          [id]
        );
        const nextVersion = (lastVersionResult.rows[0].max_version || 0) + 1;
        
        // Marcar versão atual como não atual
        await client.query(
          'UPDATE recipe_versions SET is_current = false WHERE recipe_id = $1 AND is_current = true',
          [id]
        );
        
        // Criar nova versão
        await client.query(
          `INSERT INTO recipe_versions (recipe_id, version_number, name, description, prep_time, cook_time, servings, difficulty, is_current)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [
            id,
            nextVersion,
            data.name || recipe.name,
            data.description !== undefined ? data.description : recipe.description,
            data.prep_time !== undefined ? data.prep_time : recipe.prep_time,
            data.cook_time !== undefined ? data.cook_time : recipe.cook_time,
            data.servings !== undefined ? data.servings : recipe.servings,
            data.difficulty || recipe.difficulty,
          ]
        );
      }
      
      // Atualizar receita principal
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;
      
      if (data.name) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(data.name);
        updateFields.push(`slug = $${paramCount++}`);
        updateValues.push(slugify(data.name));
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(data.description);
      }
      if (data.prep_time !== undefined) {
        updateFields.push(`prep_time = $${paramCount++}`);
        updateValues.push(data.prep_time);
      }
      if (data.cook_time !== undefined) {
        updateFields.push(`cook_time = $${paramCount++}`);
        updateValues.push(data.cook_time);
      }
      if (data.servings !== undefined) {
        updateFields.push(`servings = $${paramCount++}`);
        updateValues.push(data.servings);
      }
      if (data.difficulty) {
        updateFields.push(`difficulty = $${paramCount++}`);
        updateValues.push(data.difficulty);
      }
      if (data.image_url !== undefined) {
        updateFields.push(`image_url = $${paramCount++}`);
        updateValues.push(data.image_url);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);
      
      if (updateFields.length > 1) {
        await client.query(
          `UPDATE recipes SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
          updateValues
        );
      }
      
      await client.query('COMMIT');
      
      return await this.findById(id) as Recipe;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async delete(id: number): Promise<void> {
    await pool.query('UPDATE recipes SET is_active = false WHERE id = $1', [id]);
  }
  
  async incrementViewCount(id: number): Promise<void> {
    await pool.query(
      'UPDATE recipes SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }
  
  async getTopRecipes(limit: number = 10): Promise<Recipe[]> {
    const result = await pool.query(
      'SELECT * FROM recipes WHERE is_active = true ORDER BY view_count DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }
}

export default new RecipeService();

