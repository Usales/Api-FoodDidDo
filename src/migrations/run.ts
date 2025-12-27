import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const useSQLite = process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST;

async function runMigrations() {
  if (useSQLite) {
    // Usar SQLite
    const Database = require('better-sqlite3').default;
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'fooddiddo.db');
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    try {
      console.log('📦 Executando migrações SQLite...');
      const schemaPath = path.join(__dirname, '../config/schema-sqlite.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Executar cada comando SQL separadamente
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          if (statement.length > 0) {
            db.exec(statement + ';');
          }
        } catch (error: any) {
          // Ignorar erros de "já existe"
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn('⚠️  Aviso ao executar:', statement.substring(0, 50), '...', error.message);
          }
        }
      }
      
      console.log('✅ Migrações SQLite executadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar migrações:', error);
      throw error;
    } finally {
      db.close();
    }
  } else {
    // Usar PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fooddiddo',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    
    const client = await pool.connect();
    
    try {
      console.log('🐘 Executando migrações PostgreSQL...');
      const schemaPath = path.join(__dirname, '../config/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      await client.query(schema);
      console.log('✅ Migrações PostgreSQL executadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar migrações:', error);
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
  }
}

runMigrations()
  .then(() => {
    console.log('Migrações concluídas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha nas migrações:', error);
    process.exit(1);
  });
