# Script de Importação de Receitas

Este script importa as receitas do arquivo `FoodDidDo/public/local-recipes/recipes.json` para o banco de dados da API.

## Pré-requisitos

1. Banco de dados PostgreSQL configurado e rodando
2. Variáveis de ambiente configuradas no arquivo `.env`
3. Schema do banco de dados criado (execute `npm run migrate` primeiro)

## Como usar

### 1. Configurar o banco de dados

Certifique-se de que o arquivo `.env` está configurado:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fooddiddo
DB_USER=postgres
DB_PASSWORD=postgres
```

### 2. Criar o schema do banco

```bash
npm run migrate
```

### 3. Executar a importação

```bash
npm run seed
```

## O que o script faz

1. **Lê o arquivo** `recipes.json` do projeto FoodDidDo
2. **Cria categorias** únicas baseadas no campo `category` das receitas
3. **Cria tags** únicas baseadas no campo `area` (origem/região) das receitas
4. **Cria ingredientes** únicos baseados na lista de ingredientes
5. **Importa receitas** com:
   - Nome, slug, descrição, imagem
   - Versão inicial da receita
   - Ingredientes com quantidades
   - Passos de preparo
   - Associação com categorias e tags

## Estrutura de dados

O script processa os seguintes campos do JSON:

- `title` → Nome da receita
- `instructions` → Descrição e passos
- `ingredientsList` → Lista de ingredientes (parseada)
- `category` → Categoria
- `area` → Tag (origem/região)
- `image` → URL da imagem
- `relevanceScore` → Contador de visualizações inicial

## Notas

- Receitas duplicadas (mesmo slug) são puladas
- Ingredientes são criados automaticamente se não existirem
- O script usa transações para garantir integridade dos dados
- Erros em receitas individuais não interrompem o processo completo

## Exemplo de saída

```
📖 Lendo arquivo de receitas...
📂 Usando arquivo: C:\Users\...\FoodDidDo\public\local-recipes\recipes.json
✅ Encontradas 150 receitas para importar

📁 Criando 12 categorias...
🏷️  Criando 8 tags (áreas)...

🍳 Importando 150 receitas...

✅ Importadas 10 receitas...
✅ Importadas 20 receitas...
...

✨ Importação concluída!
   ✅ Importadas: 148
   ⏭️  Puladas: 2
   📊 Total: 150

🎉 Processo finalizado com sucesso!
```

