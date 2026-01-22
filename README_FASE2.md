# 🏗️ Fase 2: Refatoração - Clean Architecture + Prisma

## Status: Em Progresso

Esta fase implementa a arquitetura limpa e migra para Prisma ORM.

---

## 📋 O Que Está Sendo Implementado

### 1. ✅ Estrutura Clean Architecture
- **Domain Layer**: Entidades e interfaces de repositórios
- **Application Layer**: Casos de uso e DTOs
- **Infrastructure Layer**: Implementações (Prisma, cache, etc)
- **Presentation Layer**: Controllers e rotas

### 2. ✅ Schema Prisma
- Schema completo baseado no SQL existente
- Type safety completo
- Migrations automáticas

### 3. ✅ Entidades de Domínio
- `Recipe` - Entidade com validações de negócio
- `Menu` - Entidade com validações de negócio

### 4. ✅ Casos de Uso
- `CreateRecipeUseCase` - Criar receita
- `UpdateRecipeUseCase` - Atualizar receita
- (Mais casos de uso em progresso...)

### 5. ✅ Repositórios
- `PrismaRecipeRepository` - Implementação com Prisma
- (Mais repositórios em progresso...)

---

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migration inicial (se necessário)
npm run prisma:migrate
```

### 3. Configurar DATABASE_URL

No arquivo `.env`:

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/fooddiddo?schema=public"

# Ou SQLite (se preferir)
DATABASE_URL="file:./data/fooddiddo.db"
```

**Nota:** O schema Prisma atual está configurado para PostgreSQL. Para SQLite, ajuste o `provider` no `schema.prisma`.

---

## 📁 Estrutura Criada

```
src/
├── domain/                    # Camada de Domínio
│   ├── entities/             # Entidades de negócio
│   │   ├── Recipe.ts
│   │   └── Menu.ts
│   └── repositories/         # Interfaces de repositórios
│       ├── IRecipeRepository.ts
│       └── IMenuRepository.ts
│
├── application/              # Camada de Aplicação
│   ├── use-cases/           # Casos de uso
│   │   ├── recipes/
│   │   │   ├── CreateRecipeUseCase.ts
│   │   │   └── UpdateRecipeUseCase.ts
│   │   └── menus/
│   └── dto/                  # DTOs
│       ├── CreateRecipeDto.ts
│       └── UpdateRecipeDto.ts
│
└── infrastructure/           # Camada de Infraestrutura
    └── database/
        ├── prisma/
        │   └── client.ts    # Cliente Prisma singleton
        └── repositories/
            └── PrismaRecipeRepository.ts
```

---

## 🔄 Migração Gradual

A refatoração está sendo feita de forma gradual:

1. ✅ Criar estrutura Clean Architecture
2. ✅ Criar schema Prisma
3. ✅ Criar entidades de domínio
4. ✅ Criar casos de uso
5. ✅ Implementar repositórios com Prisma
6. ⏳ Refatorar controllers para usar casos de uso
7. ⏳ Remover código antigo (services, database wrapper)
8. ⏳ Testes

---

## 📝 Próximos Passos

1. **Completar repositórios**
   - `PrismaMenuRepository`
   - Repositórios auxiliares (Category, Tag, Ingredient)

2. **Completar casos de uso**
   - `DeleteRecipeUseCase`
   - `FindRecipeUseCase`
   - Casos de uso de Menu

3. **Refatorar controllers**
   - Usar casos de uso ao invés de services
   - Manter compatibilidade com rotas existentes

4. **Remover código legado**
   - Remover `src/services/`
   - Remover wrapper SQLite/PostgreSQL manual
   - Atualizar imports

5. **Testes**
   - Testes unitários dos casos de uso
   - Testes de integração dos repositórios

---

## ⚠️ Notas Importantes

- **Compatibilidade**: As rotas antigas continuam funcionando durante a migração
- **Prisma**: Requer PostgreSQL por padrão (pode ser ajustado para SQLite)
- **Migrations**: Execute `prisma migrate dev` para criar as tabelas
- **Type Safety**: Prisma gera tipos TypeScript automaticamente

---

## 🐛 Problemas Conhecidos

- Schema Prisma ainda não foi testado com banco real
- Repositórios precisam de testes
- Controllers ainda não foram refatorados

---

**Última atualização:** 22 de Janeiro de 2025  
**Status:** Em progresso (60% completo)
