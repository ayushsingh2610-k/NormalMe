'use server'

import { createClient }       from '@/lib/supabase/server'
import { redirect }           from 'next/navigation'
import { getRecommendations } from '@/lib/gemini'
import type { DishSuggestion, RecommendationResponse } from '@/lib/gemini'
import { daysUntilExpiry }    from '@/lib/utils/expiry'

export type { DishSuggestion }

export type ContextSnapshot = {
  energy: string
  expiring_item_count: number
  pantry_item_count: number
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/** Main: fetch data + call Gemini for recommendations */
export async function fetchRecommendations(
  energy: 'low' | 'normal' | 'high'
): Promise<RecommendationResponse> {
  const { supabase, user } = await getUser()

  // Load profile
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

  // Load pantry
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

  const threeDaysOut = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0]
  const expiringSoon = pantryList
    .filter(i => i.expiry_date && i.expiry_date <= threeDaysOut)
    .map(i => ({ ...i, daysLeft: daysUntilExpiry(i.expiry_date) ?? 99 }))

  // Call Gemini
  const result = await getRecommendations(profile, pantryList, expiringSoon, energy)

  // Log to interactions
  const context: ContextSnapshot = {
    energy,
    expiring_item_count: expiringSoon.length,
    pantry_item_count: pantryList.length,
  }
  await supabase.from('interactions').insert({
    user_id:          user.id,
    action:           'view_recommendation',
    recipe_snapshot:  null,
    context_snapshot: context,
  })

  return result
}

/** Log a specific user action on a dish */
export async function logInteraction(
  action: 'click_dish' | 'cook' | 'skip' | 'rate',
  dish: DishSuggestion,
  context: ContextSnapshot,
  rating?: number
) {
  const { supabase, user } = await getUser()
  await supabase.from('interactions').insert({
    user_id:          user.id,
    action,
    recipe_snapshot:  dish,
    context_snapshot: context,
    rating:           rating ?? null,
  })
}
