import pool from '../config/database';
import { Category } from '../types';
import { slugify } from '../utils/slugify';

export class CategoryService {
  async create(name: string, description?: string): Promise<Category> {
    const slug = slugify(name);
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, description || null]
    );
    return result.rows[0];
  }
  
  async findAll(): Promise<Category[]> {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return result.rows;
  }
  
  async findById(id: number): Promise<Category | null> {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}

export default new CategoryService();

