import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

async function runMigrations() {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const dbPath = path.join(dbDir, 'fooddiddo.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  try {
    console.log('Executando migrações SQLite...');
    const schemaPath = path.join(__dirname, '../config/schema-sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Executar cada comando SQL separadamente
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        db.exec(statement + ';');
      } catch (error: any) {
        // Ignorar erros de "já existe" para tabelas e índices
        if (!error.message.includes('already exists')) {
          console.warn('Aviso ao executar:', statement.substring(0, 50), error.message);
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

