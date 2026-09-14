import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export type DishSuggestion = {
  name: string
  emoji: string
  reason: string
  estimated_minutes: number
  effort: 'easy' | 'moderate' | 'complex'
  match_score: number
  key_ingredients: string[]
  uses_expiring: boolean
}

export type RecommendationResponse = {
  suggestions: DishSuggestion[]
}

export type RecipeDetail = {
  name: string
  description: string
  prep_time: number
  cook_time: number
  servings: number
  ingredients: { name: string; amount: string; unit: string }[]
  steps: string[]
  tips: string
  estimated_calories?: number
}

type UserProfile = {
  skill_level: string
  diet_type: string
  allergens: string[]
  household_size: number
}

type PantryEntry = {
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date?: string | null
  daysLeft?: number
}

type EnergyLevel = 'low' | 'normal' | 'high'

const ENERGY_DESC: Record<EnergyLevel, string> = {
  low: 'max 20 minutes total, minimal steps, very little cleanup',
  normal: '20–45 minutes, moderate complexity',
  high: '45+ minutes, complex techniques, multiple components welcome',
}

/** Parse and validate LLM JSON safely */
function parseJSON<T>(raw: string, fallback: T): T {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    return fallback
  }
}

/** Get 4 dish recommendations based on pantry + profile + energy */
export async function getRecommendations(
  profile: UserProfile,
  pantry: PantryEntry[],
  expiringSoon: PantryEntry[],
  energy: EnergyLevel
): Promise<RecommendationResponse> {
  if (!process.env.GEMINI_API_KEY) {
    return { suggestions: getMockSuggestions(energy) }
  }

  const pantryList = pantry.length > 0
    ? pantry.map(i => `- ${i.name} (${i.quantity} ${i.unit}, ${i.category})`).join('\n')
    : '- (pantry is empty)'

  const expiringList = expiringSoon.length > 0
    ? expiringSoon.map(i => `- ${i.name} (${i.daysLeft === 0 ? 'expires today' : `${i.daysLeft}d left`})`).join('\n')
    : 'none'

  const allergenStr = profile.allergens.length > 0
    ? profile.allergens.join(', ')
    : 'none'

  const prompt = `You are NormalMe, a smart cooking assistant. Suggest 4 dishes a user can cook.

USER PROFILE:
- Skill level: ${profile.skill_level}
- Diet: ${profile.diet_type === 'none' ? 'no restriction' : profile.diet_type}
- Allergens to STRICTLY AVOID: ${allergenStr}
- Household size: ${profile.household_size}

PANTRY:
${pantryList}

EXPIRING SOON (prioritise these):
${expiringList}

ENERGY LEVEL: "${energy}" → ${ENERGY_DESC[energy]}

RULES:
1. NEVER include a dish that contains the user's allergens.
2. Respect the diet type strictly.
3. Prefer dishes using expiring items.
4. Match time/effort to the energy level.
5. Only suggest dishes the user can make primarily from their pantry.

Respond ONLY with valid JSON matching this exact schema (no extra text):
{
  "suggestions": [
    {
      "name": "Dish name",
      "emoji": "🍛",
      "reason": "Why this fits (≤12 words)",
      "estimated_minutes": 25,
      "effort": "easy",
      "match_score": 90,
      "key_ingredients": ["ingredient1", "ingredient2", "ingredient3"],
      "uses_expiring": true
    }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = parseJSON<RecommendationResponse>(text, { suggestions: [] })

    // Hard allergen filter — application-level safety net
    const safe = parsed.suggestions.filter(dish => {
      const combined = [
        dish.name,
        ...dish.key_ingredients,
      ].join(' ').toLowerCase()
      return !profile.allergens.some(a => combined.includes(a.toLowerCase()))
    })

    return { suggestions: safe.slice(0, 4) }
  } catch (e) {
    console.error('[Gemini] recommendation error:', e)
    return { suggestions: getMockSuggestions(energy) }
  }
}

/** Generate full recipe detail for a dish */
export async function getRecipeDetail(
  dishName: string,
  profile: UserProfile,
  pantry: PantryEntry[]
): Promise<RecipeDetail | null> {
  if (!process.env.GEMINI_API_KEY) return getMockRecipe(dishName, profile)

  const pantryList = pantry.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')
  const allergenStr = profile.allergens.length > 0 ? profile.allergens.join(', ') : 'none'

  const prompt = `Generate a detailed recipe for "${dishName}".

USER CONSTRAINTS:
- Diet: ${profile.diet_type === 'none' ? 'no restriction' : profile.diet_type}
- Allergens to avoid: ${allergenStr}
- Servings needed: ${profile.household_size}
- Skill level: ${profile.skill_level}
- Available pantry: ${pantryList}

Respond ONLY with valid JSON:
{
  "name": "${dishName}",
  "description": "2-sentence description",
  "prep_time": 10,
  "cook_time": 20,
  "servings": ${profile.household_size},
  "ingredients": [
    { "name": "ingredient", "amount": "1", "unit": "cup" }
  ],
  "steps": [
    "Step 1...",
    "Step 2..."
  ],
  "tips": "One useful tip for this dish.",
  "estimated_calories": 450
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseJSON<RecipeDetail>(text, getMockRecipe(dishName, profile))
  } catch (e) {
    console.error('[Gemini] recipe error:', e)
    return getMockRecipe(dishName, profile)
  }
}

// ─── Mock fallbacks (when GEMINI_API_KEY is not set) ─────────────────────────

function getMockSuggestions(energy: EnergyLevel): DishSuggestion[] {
  const byEnergy: Record<EnergyLevel, DishSuggestion[]> = {
    low: [
      { name: 'Veggie Omelette', emoji: '🍳', reason: 'Quick protein-rich breakfast', estimated_minutes: 10, effort: 'easy', match_score: 88, key_ingredients: ['eggs', 'onion', 'tomato'], uses_expiring: false },
      { name: 'Toast with Avocado', emoji: '🥑', reason: 'No-cook, nutritious snack', estimated_minutes: 5, effort: 'easy', match_score: 82, key_ingredients: ['bread', 'avocado', 'salt'], uses_expiring: false },
    ],
    normal: [
      { name: 'Stir-fried Rice', emoji: '🍚', reason: 'Uses pantry staples efficiently', estimated_minutes: 25, effort: 'easy', match_score: 91, key_ingredients: ['rice', 'egg', 'vegetables'], uses_expiring: false },
      { name: 'Dal Tadka', emoji: '🍲', reason: 'Comfort classic from your pantry', estimated_minutes: 35, effort: 'moderate', match_score: 87, key_ingredients: ['lentils', 'onion', 'tomato', 'spices'], uses_expiring: false },
      { name: 'Pasta Arrabbiata', emoji: '🍝', reason: 'Simple yet flavourful pasta dish', estimated_minutes: 30, effort: 'easy', match_score: 84, key_ingredients: ['pasta', 'tomato', 'garlic'], uses_expiring: false },
    ],
    high: [
      { name: 'Chicken Biryani', emoji: '🍛', reason: 'Aromatic one-pot celebration', estimated_minutes: 70, effort: 'complex', match_score: 93, key_ingredients: ['rice', 'chicken', 'onion', 'spices'], uses_expiring: false },
      { name: 'Stuffed Bell Peppers', emoji: '🫑', reason: 'Impressive dish using pantry items', estimated_minutes: 55, effort: 'moderate', match_score: 86, key_ingredients: ['capsicum', 'rice', 'cheese', 'vegetables'], uses_expiring: false },
    ],
  }
  return byEnergy[energy] ?? byEnergy.normal
}

function getMockRecipe(name: string, profile: UserProfile): RecipeDetail {
  return {
    name,
    description: `A delicious ${name} made with simple ingredients from your pantry. Perfect for ${profile.household_size} person${profile.household_size !== 1 ? 's' : ''}.`,
    prep_time: 10,
    cook_time: 20,
    servings: profile.household_size,
    ingredients: [
      { name: 'Main ingredient', amount: '2', unit: 'cups' },
      { name: 'Onion', amount: '1', unit: 'medium' },
      { name: 'Oil', amount: '2', unit: 'tbsp' },
      { name: 'Salt', amount: '1', unit: 'tsp' },
    ],
    steps: [
      'Prepare all ingredients.',
      'Heat oil in a pan over medium heat.',
      'Add onion and cook until softened.',
      'Add remaining ingredients and cook through.',
      'Season to taste and serve hot.',
    ],
    tips: 'This is a demo recipe. Add your GEMINI_API_KEY for real AI-generated recipes.',
    estimated_calories: 350,
  }
}
