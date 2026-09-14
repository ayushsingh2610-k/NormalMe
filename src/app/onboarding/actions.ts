'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface OnboardingData {
  skill_level: string
  diet_type: string
  allergens: string[]
  household_size: number
}

export async function saveOnboarding(data: OnboardingData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase.from('user_preferences').upsert(
    {
      user_id: user.id,
      skill_level: data.skill_level,
      diet_type: data.diet_type,
      allergens: data.allergens,
      household_size: data.household_size,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function skipOnboarding() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Insert a default preferences record so we don't ask again
  await supabase.from('user_preferences').upsert(
    {
      user_id: user.id,
      skill_level: 'home_cook',
      diet_type: 'none',
      allergens: [],
      household_size: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  revalidatePath('/', 'layout')
  redirect('/')
}
