import pool from '../config/database';
import { Ingredient } from '../types';

export class IngredientService {
  async create(name: string, unit: string): Promise<Ingredient> {
    const result = await pool.query(
      'INSERT INTO ingredients (name, unit) VALUES ($1, $2) RETURNING *',
      [name, unit]
    );
    return result.rows[0];
  }
  
  async findAll(): Promise<Ingredient[]> {
    const result = await pool.query('SELECT * FROM ingredients ORDER BY name ASC');
    return result.rows;
  }
  
  async findById(id: number): Promise<Ingredient | null> {
    const result = await pool.query('SELECT * FROM ingredients WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
  
  async findByName(name: string): Promise<Ingredient | null> {
    const result = await pool.query('SELECT * FROM ingredients WHERE name = $1', [name]);
    return result.rows[0] || null;
  }
}

export default new IngredientService();

