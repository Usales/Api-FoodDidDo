import fs from 'fs';
import path from 'path';

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

// Ler receitas do FoodDidDo
const recipesPath = path.join(__dirname, '../../../FoodDidDo/public/local-recipes/recipes.json');
const outputPath = path.join(__dirname, '../../data/recipes-imported.json');

console.log('📖 Lendo receitas de:', recipesPath);

if (!fs.existsSync(recipesPath)) {
  console.error('❌ Arquivo não encontrado! Verifique o caminho.');
  process.exit(1);
}

const recipesData = fs.readFileSync(recipesPath, 'utf-8');
const localRecipes: LocalRecipe[] = JSON.parse(recipesData);

console.log(`✅ Encontradas ${localRecipes.length} receitas`);

// Converter para formato da API
const apiRecipes = localRecipes.map(recipe => ({
  id: recipe.id.replace('local-', ''),
  name: recipe.title,
  slug: recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  description: recipe.instructions.substring(0, 500),
  image_url: recipe.image,
  category: recipe.category,
  area: recipe.area,
  ingredients: recipe.ingredientsList,
  view_count: recipe.relevanceScore || 0,
  source: recipe.source,
  video: recipe.video,
}));

// Criar diretório se não existir
const dataDir = path.dirname(outputPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Salvar
fs.writeFileSync(outputPath, JSON.stringify(apiRecipes, null, 2), 'utf-8');

console.log(`\n✨ ${apiRecipes.length} receitas convertidas e salvas em:`);
console.log(`   ${outputPath}`);
console.log(`\n✅ Pronto! As receitas estão em formato JSON para uso na API.`);

