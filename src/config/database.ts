import dotenv from 'dotenv';

dotenv.config();

const useSQLite = process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST;

if (useSQLite) {
  // Usar SQLite (mais fácil para desenvolvimento)
  const Database = require('better-sqlite3').default;
  const path = require('path');
  const fs = require('fs');
  
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const dbPath = path.join(dbDir, 'fooddiddo.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Wrapper para compatibilidade com PostgreSQL
  const sqlitePool = {
    query: (text: string, params?: any[]) => {
      return new Promise((resolve, reject) => {
        try {
          const upperText = text.trim().toUpperCase();
          
          // Adaptar SQL do PostgreSQL para SQLite
          let adaptedText = text
            .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/RETURNING \*/gi, '')
            .replace(/RETURNING id/gi, '')
            .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
            .replace(/ON CONFLICT \(slug\) DO UPDATE/gi, 'ON CONFLICT(slug) DO UPDATE')
            .replace(/ON CONFLICT DO NOTHING/gi, 'ON CONFLICT DO NOTHING')
            .replace(/BOOLEAN/gi, 'INTEGER')
            .replace(/DEFAULT true/gi, 'DEFAULT 1')
            .replace(/DEFAULT false/gi, 'DEFAULT 0');
          
          if (upperText.startsWith('SELECT') || upperText.startsWith('WITH')) {
            const stmt = db.prepare(adaptedText);
            const rows = params ? stmt.all(...params) : stmt.all();
            resolve({ rows, rowCount: rows.length });
          } else if (upperText.startsWith('INSERT')) {
            const stmt = db.prepare(adaptedText);
            const result = params ? stmt.run(...params) : stmt.run();
            // Para INSERT, buscar o registro inserido se necessário
            if (text.includes('RETURNING')) {
              const selectStmt = db.prepare(`SELECT * FROM ${text.match(/INTO\s+(\w+)/i)?.[1]} WHERE id = ?`);
              const inserted = selectStmt.get(result.lastInsertRowid);
              resolve({ rows: inserted ? [inserted] : [], rowCount: result.changes || 0, insertId: result.lastInsertRowid });
            } else {
              resolve({ rows: [], rowCount: result.changes || 0, insertId: result.lastInsertRowid });
            }
          } else {
            const stmt = db.prepare(adaptedText);
            const result = params ? stmt.run(...params) : stmt.run();
            resolve({ rows: [], rowCount: result.changes || 0 });
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    connect: async () => {
      return {
        query: (text: string, params?: any[]) => {
          return new Promise((resolve, reject) => {
            try {
              const upperText = text.trim().toUpperCase();
              
              let adaptedText = text
                .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
                .replace(/RETURNING \*/gi, '')
                .replace(/RETURNING id/gi, '')
                .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
                .replace(/BOOLEAN/gi, 'INTEGER')
                .replace(/DEFAULT true/gi, 'DEFAULT 1')
                .replace(/DEFAULT false/gi, 'DEFAULT 0');
              
              if (upperText.startsWith('SELECT') || upperText.startsWith('WITH')) {
                const stmt = db.prepare(adaptedText);
                const rows = params ? stmt.all(...params) : stmt.all();
                resolve({ rows, rowCount: rows.length });
              } else if (upperText.startsWith('INSERT')) {
                const stmt = db.prepare(adaptedText);
                const result = params ? stmt.run(...params) : stmt.run();
                if (text.includes('RETURNING')) {
                  const tableName = text.match(/INTO\s+(\w+)/i)?.[1];
                  if (tableName) {
                    const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
                    const inserted = selectStmt.get(result.lastInsertRowid);
                    resolve({ rows: inserted ? [inserted] : [], rowCount: result.changes || 0, insertId: result.lastInsertRowid });
                  } else {
                    resolve({ rows: [], rowCount: result.changes || 0, insertId: result.lastInsertRowid });
                  }
                } else {
                  resolve({ rows: [], rowCount: result.changes || 0, insertId: result.lastInsertRowid });
                }
              } else {
                const stmt = db.prepare(adaptedText);
                const result = params ? stmt.run(...params) : stmt.run();
                resolve({ rows: [], rowCount: result.changes || 0 });
              }
            } catch (error) {
              reject(error);
            }
          });
        },
        release: () => {},
      };
    },
    end: async () => {
      db.close();
    },
  };
  
  console.log('📦 Usando SQLite (banco local: data/fooddiddo.db)');
  module.exports = sqlitePool;
  export default sqlitePool as any;
} else {
  // Usar PostgreSQL
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fooddiddo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  console.log('🐘 Usando PostgreSQL');
  module.exports = pool;
  export default pool;
}
