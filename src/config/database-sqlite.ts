import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Criar diretório de dados se não existir
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'fooddiddo.db');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Wrapper para compatibilidade com PostgreSQL
export const sqlitePool = {
  query: (text: string, params?: any[]) => {
    try {
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(text);
        const rows = params ? stmt.all(...params) : stmt.all();
        return Promise.resolve({ rows, rowCount: rows.length });
      } else {
        const stmt = db.prepare(text);
        const result = params ? stmt.run(...params) : stmt.run();
        return Promise.resolve({ rows: [], rowCount: result.changes || 0 });
      }
    } catch (error) {
      return Promise.reject(error);
    }
  },
  connect: async () => {
    return {
      query: (text: string, params?: any[]) => {
        try {
          if (text.trim().toUpperCase().startsWith('SELECT')) {
            const stmt = db.prepare(text);
            const rows = params ? stmt.all(...params) : stmt.all();
            return Promise.resolve({ rows, rowCount: rows.length });
          } else {
            const stmt = db.prepare(text);
            const result = params ? stmt.run(...params) : stmt.run();
            return Promise.resolve({ rows: [], rowCount: result.changes || 0 });
          }
        } catch (error) {
          return Promise.reject(error);
        }
      },
      release: () => {},
    };
  },
  end: async () => {
    db.close();
  },
};

export default sqlitePool;

