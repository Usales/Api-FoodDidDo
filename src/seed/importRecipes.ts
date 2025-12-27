import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { slugify } from '../utils/slugify';

dotenv.config();

interface LocalRecipe {
  id: string;
  title: string;
  image: string;
  instructions: string;
  ingredient: string;
  category: string;
  area: string;
  video: string | null;
  source: string;
  ingredientsList: string;
  relevanceScore: number;
  apiType: string;
}

// Função para parsear lista de ingredientes
function parseIngredients(ingredientsList: string): Array<{ name: string; quantity: string; unit: string }> {
  const ingredients: Array<{ name: string; quantity: string; unit: string }> = [];
  
  if (!ingredientsList || ingredientsList.trim() === '') {
    return ingredients;
  }
  
  // Dividir por vírgula
  const parts = ingredientsList.split(',').map(s => s.trim()).filter(s => s.length > 0);
  
  for (const part of parts) {
    // Padrões comuns: "3 ovos", "1 xícara de açúcar", "sal a gosto", "500g de farinha"
    const patterns = [
      /^(\d+(?:\.\d+)?)\s*(xícara|colher|colheres|g|kg|ml|l|unidade|unidades|dente|dentes|fatia|fatias|gramas?|litros?|mililitros?)\s+(?:de\s+)?(.+)$/i,
      /^(\d+(?:\.\d+)?)\s+(.+)$/i,
      /^(.+)$/i,
    ];
    
    let matched = false;
    for (const pattern of patterns) {
      const match = part.match(pattern);
      if (match) {
        if (match[1] && match[2] && match[3]) {
          // Padrão com quantidade, unidade e nome
          ingredients.push({
            name: match[3].trim(),
            quantity: match[1],
            unit: match[2].toLowerCase(),
          });
        } else if (match[1] && match[2] && !match[3]) {
          // Padrão com quantidade e nome (sem unidade explícita)
          const quantity = match[1];
          const rest = match[2].trim();
          
          // Tentar extrair unidade do nome
          const unitMatch = rest.match(/^(xícara|colher|colheres|g|kg|ml|l|unidade|unidades|dente|dentes|fatia|fatias|gramas?|litros?|mililitros?)\s+(?:de\s+)?(.+)$/i);
          
          if (unitMatch) {
            ingredients.push({
              name: unitMatch[2]?.trim() || rest,
              quantity: quantity,
              unit: unitMatch[1].toLowerCase(),
            });
          } else {
            ingredients.push({
              name: rest,
              quantity: quantity,
              unit: 'unidade',
            });
          }
        } else {
          // Apenas nome (ex: "sal a gosto")
          ingredients.push({
            name: match[1]?.trim() || part,
            quantity: '1',
            unit: 'unidade',
          });
        }
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // Fallback: usar o texto completo como nome
      ingredients.push({
        name: part,
        quantity: '1',
        unit: 'unidade',
      });
    }
  }
  
  return ingredients;
}

// Função para parsear instruções em passos
function parseSteps(instructions: string): Array<{ step_number: number; instruction: string }> {
  const steps: Array<{ step_number: number; instruction: string }> = [];
  
  // Dividir por quebras de linha ou números
  const lines = instructions.split(/\n+/).filter(line => line.trim());
  
  lines.forEach((line, index) => {
    // Remover números no início (ex: "1. ", "2. ")
    const cleaned = line.replace(/^\d+\.\s*/, '').trim();
    if (cleaned) {
      steps.push({
        step_number: index + 1,
        instruction: cleaned,
      });
    }
  });
  
  return steps;
}

async function importRecipes() {
  // Verificar se deve usar SQLite
  const useSQLite = process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST;
  
  let pool: any;
  let client: any;
  let useTransaction = true;
  
  if (useSQLite) {
    const Database = require('better-sqlite3').default;
    const dbDir = require('path').join(process.cwd(), 'data');
    const dbPath = require('path').join(dbDir, 'fooddiddo.db');
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    pool = {
      connect: async () => ({
        query: (text: string, params?: any[]) => {
          return new Promise((resolve, reject) => {
            try {
              const upperText = text.trim().toUpperCase();
              if (upperText.startsWith('SELECT') || upperText.startsWith('WITH')) {
                const stmt = db.prepare(text);
                const rows = params ? stmt.all(...params) : stmt.all();
                resolve({ rows, rowCount: rows.length });
              } else {
                const stmt = db.prepare(text);
                const result = params ? stmt.run(...params) : stmt.run();
                resolve({ rows: [], rowCount: result.changes || 0, insertId: result.lastInsertRowid });
              }
            } catch (error) {
              reject(error);
            }
          });
        },
        release: () => {},
      }),
      end: async () => db.close(),
    };
    useTransaction = false; // SQLite usa transações automáticas
  } else {
    pool = require('../config/database').default;
  }
  
  client = await pool.connect();
  
  try {
    if (useTransaction) {
      await client.query('BEGIN');
    }
    
    console.log('📖 Lendo arquivo de receitas...');
    // Tentar múltiplos caminhos possíveis
    const possiblePaths = [
      path.join(process.cwd(), '../FoodDidDo/public/local-recipes/recipes.json'),
      path.join(process.cwd(), 'FoodDidDo/public/local-recipes/recipes.json'),
      path.join(__dirname, '../../../FoodDidDo/public/local-recipes/recipes.json'),
      path.join(__dirname, '../../../../FoodDidDo/public/local-recipes/recipes.json'),
    ];
    
    let recipesPath: string | null = null;
    for (const p of possiblePaths) {
      const normalizedPath = path.normalize(p);
      if (fs.existsSync(normalizedPath)) {
        recipesPath = normalizedPath;
        break;
      }
    }
    
    if (!recipesPath) {
      console.error('❌ Caminhos tentados:');
      possiblePaths.forEach(p => console.error(`   - ${path.normalize(p)}`));
      throw new Error('Arquivo recipes.json não encontrado. Verifique se o projeto FoodDidDo está no diretório correto.');
    }
    
    console.log(`📂 Usando arquivo: ${recipesPath}`);
    const recipesData = fs.readFileSync(recipesPath, 'utf-8');
    const localRecipes: LocalRecipe[] = JSON.parse(recipesData);
    
    console.log(`✅ Encontradas ${localRecipes.length} receitas para importar\n`);
    
    // Mapear categorias e áreas únicas
    const categoriesMap = new Map<string, number>();
    const areasMap = new Map<string, number>();
    const ingredientsMap = new Map<string, number>();
    
    // Criar categorias
    const uniqueCategories = [...new Set(localRecipes.map(r => r.category))];
    console.log(`📁 Criando ${uniqueCategories.length} categorias...`);
    
    for (const categoryName of uniqueCategories) {
      if (!categoryName) continue;
      
      const slug = slugify(categoryName);
      const result = await client.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [categoryName, slug]
      );
      categoriesMap.set(categoryName, result.rows[0].id);
    }
    
    // Criar tags (usando áreas)
    const uniqueAreas = [...new Set(localRecipes.map(r => r.area))];
    console.log(`🏷️  Criando ${uniqueAreas.length} tags (áreas)...`);
    
    for (const areaName of uniqueAreas) {
      if (!areaName) continue;
      
      const slug = slugify(areaName);
      const result = await client.query(
        `INSERT INTO tags (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [areaName, slug]
      );
      areasMap.set(areaName, result.rows[0].id);
    }
    
    console.log(`\n🍳 Importando ${localRecipes.length} receitas...\n`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const localRecipe of localRecipes) {
      try {
        const slug = slugify(localRecipe.title);
        
        // Verificar se receita já existe
        const existing = await client.query(
          'SELECT id FROM recipes WHERE slug = $1',
          [slug]
        );
        
        if (existing.rows.length > 0) {
          console.log(`⏭️  Pulando: ${localRecipe.title} (já existe)`);
          skipped++;
          continue;
        }
        
        // Criar receita
        const recipeResult = await client.query(
          `INSERT INTO recipes (name, slug, description, image_url, view_count)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            localRecipe.title,
            slug,
            localRecipe.instructions.substring(0, 500), // Limitar descrição
            localRecipe.image.startsWith('/') ? localRecipe.image : `/local-recipes/images/${localRecipe.image}`,
            localRecipe.relevanceScore || 0,
          ]
        );
        
        const recipeId = recipeResult.rows[0].id;
        
        // Criar versão inicial
        const versionResult = await client.query(
          `INSERT INTO recipe_versions (recipe_id, version_number, name, description, is_current)
           VALUES ($1, 1, $2, $3, true)
           RETURNING id`,
          [
            recipeId,
            localRecipe.title,
            localRecipe.instructions,
          ]
        );
        
        const versionId = versionResult.rows[0].id;
        
        // Processar e criar ingredientes
        const parsedIngredients = parseIngredients(localRecipe.ingredientsList);
        
        for (const ing of parsedIngredients) {
          // Buscar ou criar ingrediente
          let ingredientId = ingredientsMap.get(ing.name.toLowerCase());
          
          if (!ingredientId) {
            const ingResult = await client.query(
              `INSERT INTO ingredients (name, unit) VALUES ($1, $2)
               ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [ing.name, ing.unit]
            );
            ingredientId = ingResult.rows[0].id;
            ingredientsMap.set(ing.name.toLowerCase(), ingredientId);
          }
          
          // Adicionar ingrediente à receita
          await client.query(
            `INSERT INTO recipe_ingredients (recipe_id, recipe_version_id, ingredient_id, quantity, unit)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              recipeId,
              versionId,
              ingredientId,
              parseFloat(ing.quantity) || 1,
              ing.unit,
            ]
          );
        }
        
        // Processar e criar passos
        const steps = parseSteps(localRecipe.instructions);
        
        for (const step of steps) {
          await client.query(
            `INSERT INTO recipe_steps (recipe_id, recipe_version_id, step_number, instruction)
             VALUES ($1, $2, $3, $4)`,
            [
              recipeId,
              versionId,
              step.step_number,
              step.instruction,
            ]
          );
        }
        
        // Associar categoria
        if (localRecipe.category) {
          const categoryId = categoriesMap.get(localRecipe.category);
          if (categoryId) {
            await client.query(
              `INSERT INTO recipe_categories (recipe_id, category_id)
               VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [recipeId, categoryId]
            );
          }
        }
        
        // Associar tag (área)
        if (localRecipe.area) {
          const areaId = areasMap.get(localRecipe.area);
          if (areaId) {
            await client.query(
              `INSERT INTO recipe_tags (recipe_id, tag_id)
               VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [recipeId, areaId]
            );
          }
        }
        
        imported++;
        if (imported % 10 === 0) {
          console.log(`✅ Importadas ${imported} receitas...`);
        }
      } catch (error) {
        console.error(`❌ Erro ao importar receita "${localRecipe.title}":`, error);
        skipped++;
      }
    }
    
    if (useTransaction) {
      await client.query('COMMIT');
    }
    
    console.log(`\n✨ Importação concluída!`);
    console.log(`   ✅ Importadas: ${imported}`);
    console.log(`   ⏭️  Puladas: ${skipped}`);
    console.log(`   📊 Total: ${localRecipes.length}`);
  } catch (error) {
    if (useTransaction) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Erro na importação:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  importRecipes()
    .then(() => {
      console.log('\n🎉 Processo finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Falha na importação:', error);
      process.exit(1);
    });
}

export default importRecipes;

