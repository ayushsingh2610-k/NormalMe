import { redirect }         from 'next/navigation'
import { createClient }     from '@/lib/supabase/server'
import { getRecipeDetail }  from '@/lib/gemini'
import RecipeClient         from './RecipeClient'

interface Props {
  searchParams: Promise<{ dish?: string; emoji?: string; energy?: string }>
}

export async function generateMetadata({ searchParams }: Props) {
  const p = await searchParams
  return { title: `${p.dish ?? 'Recipe'} — NormalMe` }
}

export default async function RecipePage({ searchParams }: Props) {
  const { dish, emoji = '🍳', energy = 'normal' } = await searchParams

  if (!dish) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load user profile
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('skill_level, diet_type, allergens, household_size')
    .eq('user_id', user.id)
    .maybeSingle()

  const profile = {
    skill_level:    prefs?.skill_level    ?? 'home_cook',
    diet_type:      prefs?.diet_type      ?? 'none',
    allergens:      prefs?.allergens      ?? [],
    household_size: prefs?.household_size ?? 1,
  }

  // Load pantry for context
  const { data: pantry } = await supabase
    .from('pantry_items')
    .select('name, category, quantity, unit, expiry_date')
    .eq('user_id', user.id)

  const pantryList = (pantry ?? []).map(i => ({
    name:        i.name,
    category:    i.category,
    quantity:    i.quantity,
    unit:        i.unit,
    expiry_date: i.expiry_date,
  }))

  // Generate recipe via Gemini
  const recipe = await getRecipeDetail(dish, profile, pantryList)

  if (!recipe) redirect('/?error=recipe_failed')

  return (
    <RecipeClient
      recipe={recipe}
      emoji={decodeURIComponent(emoji)}
      energy={energy}
    />
  )
}
