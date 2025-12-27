# API-FOODDIDDO

API RESTful para cardápio digital e gestão de receitas.

## Funcionalidades

- CRUD de receitas com versionamento
- CRUD de ingredientes e passos
- Associação de receitas a cardápios
- Cardápios multi-restaurante
- Sistema de tags e categorias
- Ranking de receitas por visualização
- Métricas de acesso por item de cardápio

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo `.env.example` para `.env`
2. Configure as variáveis de ambiente conforme necessário

## Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## Importação de Receitas

Para importar as receitas do projeto FoodDidDo:

1. Configure o banco de dados no arquivo `.env`
2. Execute as migrações: `npm run migrate`
3. Execute o seed: `npm run seed`

Veja mais detalhes em `SEED_README.md`

## Estrutura do Projeto

```
src/
├── config/       # Configurações (banco, etc)
├── controllers/  # Controllers das rotas
├── middleware/   # Middlewares (auth, validação, etc)
├── models/       # Modelos de dados
├── routes/       # Definição de rotas
├── services/     # Lógica de negócio
├── types/        # Tipos TypeScript
└── utils/        # Utilitários
```

## Endpoints

### Públicos (Leitura)
- `GET /api/menus/:restaurantId` - Listar cardápio de um restaurante
- `GET /api/menus/:restaurantId/items/:itemId` - Detalhes de um item do cardápio

### Protegidos (Escrita)
- `POST /api/recipes` - Criar receita
- `PUT /api/recipes/:id` - Atualizar receita
- `DELETE /api/recipes/:id` - Deletar receita
- `POST /api/menus` - Criar cardápio
- `PUT /api/menus/:id` - Atualizar cardápio
- E mais...

## Banco de Dados

O projeto utiliza PostgreSQL como banco de dados relacional.

