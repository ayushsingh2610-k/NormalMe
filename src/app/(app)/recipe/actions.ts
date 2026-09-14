'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'

export async function logCookAction(
  dishName: string,
  recipeSnapshot: object,
  energy: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('interactions').insert({
    user_id:          user.id,
    action:           'cook',
    recipe_snapshot:  recipeSnapshot,
    context_snapshot: { energy, dish_name: dishName },
  })
}

export async function logSaveAction(dishName: string, recipeSnapshot: object) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('interactions').insert({
    user_id:          user.id,
    action:           'save',
    recipe_snapshot:  recipeSnapshot,
    context_snapshot: { dish_name: dishName },
  })
}
