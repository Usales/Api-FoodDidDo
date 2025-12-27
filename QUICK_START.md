# Guia Rápido de Início

## Problema: PostgreSQL não está rodando

O erro `ECONNREFUSED` significa que o PostgreSQL não está instalado ou não está rodando.

## Solução Rápida: Usar SQLite

A API foi configurada para usar **SQLite por padrão**, que não precisa de servidor!

### Passos:

1. **Instalar dependências adicionais:**
   ```bash
   npm install better-sqlite3 @types/better-sqlite3
   ```

2. **Verificar arquivo .env:**
   O arquivo `.env` já está configurado para usar SQLite:
   ```env
   DB_TYPE=sqlite
   ```

3. **Executar migrações:**
   ```bash
   npm run migrate
   ```
   Isso criará o arquivo `data/fooddiddo.db` automaticamente.

4. **Importar receitas:**
   ```bash
   npm run seed
   ```

5. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

## Se quiser usar PostgreSQL depois:

1. Instale o PostgreSQL
2. Crie o banco de dados
3. Edite o `.env`:
   ```env
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fooddiddo
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   ```

## Estrutura de arquivos criada:

- `data/fooddiddo.db` - Banco SQLite (criado automaticamente)

