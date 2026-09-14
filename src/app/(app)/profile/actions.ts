'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'

export async function updateProfile(displayName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.auth.updateUser({
    data: { full_name: displayName.trim() },
  })
  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}

export async function updatePreferences(prefs: {
  skill_level: string
  diet_type: string
  allergens: string[]
  household_size: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Delete all user data (RLS cascade handles related tables)
  await supabase.from('pantry_items').delete().eq('user_id', user.id)
  await supabase.from('shopping_list_items').delete().eq('user_id', user.id)
  await supabase.from('interactions').delete().eq('user_id', user.id)
  await supabase.from('user_preferences').delete().eq('user_id', user.id)
  await supabase.auth.signOut()
  redirect('/login')
}
