import pool from '../config/database';
import { Tag } from '../types';
import { slugify } from '../utils/slugify';

export class TagService {
  async create(name: string): Promise<Tag> {
    const slug = slugify(name);
    const result = await pool.query(
      'INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [name, slug]
    );
    return result.rows[0];
  }
  
  async findAll(): Promise<Tag[]> {
    const result = await pool.query('SELECT * FROM tags ORDER BY name ASC');
    return result.rows;
  }
  
  async findById(id: number): Promise<Tag | null> {
    const result = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}

export default new TagService();

