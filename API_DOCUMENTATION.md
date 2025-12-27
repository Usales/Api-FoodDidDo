# Documentação da API - FOODDIDDO

## Base URL
```
http://localhost:3000/api
```

## Autenticação

Endpoints protegidos requerem um token JWT no header:
```
Authorization: Bearer <token>
```

## Endpoints Públicos (Leitura)

### Cardápios

#### Listar cardápios de um restaurante
```
GET /menus/restaurants/:restaurantId
```

**Resposta:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "name": "Cardápio Principal",
    "description": "Nosso cardápio completo",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Listar itens de um cardápio
```
GET /menus/:menuId/items
```

**Resposta:**
```json
[
  {
    "id": 1,
    "menu_id": 1,
    "recipe_id": 1,
    "price": 25.90,
    "display_order": 1,
    "is_available": true,
    "view_count": 150,
    "recipe_name": "Bolo de Chocolate",
    "recipe_slug": "bolo-de-chocolate",
    "recipe_image": "https://...",
    "recipe_description": "..."
  }
]
```

#### Detalhes de um item do cardápio
```
GET /menus/restaurants/:restaurantId/items/:itemId
```

**Resposta:**
```json
{
  "id": 1,
  "menu_id": 1,
  "recipe_id": 1,
  "price": 25.90,
  "display_order": 1,
  "is_available": true,
  "view_count": 151,
  "recipe_name": "Bolo de Chocolate",
  "recipe_slug": "bolo-de-chocolate",
  "recipe_image": "https://...",
  "recipe_description": "..."
}
```

### Receitas

#### Listar receitas
```
GET /recipes?limit=50&offset=0
```

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Bolo de Chocolate",
    "slug": "bolo-de-chocolate",
    "description": "Delicioso bolo de chocolate",
    "prep_time": 30,
    "cook_time": 45,
    "servings": 12,
    "difficulty": "medium",
    "image_url": "https://...",
    "view_count": 150,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Buscar receita por ID
```
GET /recipes/:id
```

#### Top receitas (mais visualizadas)
```
GET /recipes/top?limit=10
```

## Endpoints Protegidos (Escrita)

### Receitas

#### Criar receita
```
POST /recipes
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Bolo de Chocolate",
  "description": "Delicioso bolo de chocolate",
  "prep_time": 30,
  "cook_time": 45,
  "servings": 12,
  "difficulty": "medium",
  "image_url": "https://...",
  "ingredients": [
    {
      "ingredient_id": 1,
      "quantity": 500,
      "unit": "g",
      "notes": "Farinha de trigo"
    }
  ],
  "steps": [
    {
      "step_number": 1,
      "instruction": "Pré-aqueça o forno a 180°C",
      "image_url": "https://..."
    }
  ],
  "category_ids": [1, 2],
  "tag_ids": [1, 3]
}
```

#### Atualizar receita
```
PUT /recipes/:id
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Bolo de Chocolate Premium",
  "version_note": "Atualização com ingredientes premium"
}
```

Se `version_note` for fornecido, uma nova versão será criada.

#### Deletar receita (soft delete)
```
DELETE /recipes/:id
Authorization: Bearer <token>
```

### Cardápios

#### Criar cardápio
```
POST /menus
Authorization: Bearer <token>
```

**Body:**
```json
{
  "restaurant_id": 1,
  "name": "Cardápio Principal",
  "description": "Nosso cardápio completo",
  "items": [
    {
      "recipe_id": 1,
      "price": 25.90,
      "display_order": 1
    }
  ]
}
```

#### Atualizar cardápio
```
PUT /menus/:id
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Cardápio Atualizado",
  "is_active": true,
  "items": [
    {
      "recipe_id": 1,
      "price": 29.90,
      "display_order": 1,
      "is_available": true
    }
  ]
}
```

### Métricas

#### Buscar métricas de um item do cardápio
```
GET /menus/items/:menuItemId/metrics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "access_date": "2024-01-15",
    "view_count": 45,
    "recipe_id": 1,
    "restaurant_id": 1
  }
]
```

## Regras de Negócio

1. **Receita é entidade base**: Receitas podem existir sem estar em cardápios
2. **Cardápio referencia receita**: Cardápios não duplicam dados de receitas, apenas referenciam
3. **Versionamento**: Receitas podem ter múltiplas versões mantendo histórico
4. **Ranking**: Receitas são ranqueadas por número de visualizações
5. **Métricas**: Acesso a itens de cardápio é registrado diariamente para analytics

## Cache HTTP

Endpoints públicos incluem headers de cache:
- `Cache-Control: public, max-age=3600`
- `ETag` para validação condicional

## Rate Limiting

Limite de 100 requisições por IP a cada 15 minutos.

