# Configuração do Banco de Dados

## Opção 1: PostgreSQL (Recomendado para Produção)

### Instalação do PostgreSQL

1. **Windows**: Baixe e instale do site oficial: https://www.postgresql.org/download/windows/
2. Durante a instalação, anote a senha do usuário `postgres`
3. Certifique-se de que o serviço PostgreSQL está rodando

### Verificar se está rodando

```powershell
# Verificar serviço
Get-Service -Name postgresql*

# Ou tentar conectar
psql -U postgres
```

### Criar o banco de dados

```sql
-- Conectar ao PostgreSQL
psql -U postgres

-- Criar banco de dados
CREATE DATABASE fooddiddo;

-- Sair
\q
```

### Configurar .env

Edite o arquivo `.env` com suas credenciais:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fooddiddo
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

## Opção 2: SQLite (Mais fácil para desenvolvimento)

Se você não tem PostgreSQL instalado, podemos usar SQLite que não precisa de servidor.

### Instalar dependência SQLite

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

### Usar SQLite

O SQLite cria um arquivo local `fooddiddo.db` automaticamente.

## Solução Rápida: Verificar PostgreSQL

Se você já tem PostgreSQL instalado, verifique:

1. **Serviço está rodando?**
   ```powershell
   Get-Service postgresql*
   ```

2. **Iniciar serviço (se necessário)**
   ```powershell
   Start-Service postgresql-x64-15  # Ajuste o nome do serviço
   ```

3. **Testar conexão**
   ```powershell
   psql -U postgres -h localhost
   ```

## Próximos Passos

Após configurar o banco:

1. Execute as migrações: `npm run migrate`
2. Execute o seed: `npm run seed`

