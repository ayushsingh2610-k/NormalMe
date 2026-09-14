'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'

export interface PantryItemInput {
  name:        string
  category:    'fresh' | 'frozen' | 'pantry'
  quantity:    number
  unit:        string
  expiry_date: string | null
  storage:     string
  notes:       string
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function addPantryItem(data: PantryItemInput) {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('pantry_items').insert({
    user_id:     user.id,
    name:        data.name.trim(),
    category:    data.category,
    quantity:    data.quantity,
    unit:        data.unit,
    expiry_date: data.expiry_date || null,
    storage:     data.storage,
    notes:       data.notes.trim(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/pantry')
}

export async function updatePantryItem(id: string, data: Partial<PantryItemInput>) {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('pantry_items')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/pantry')
}

export async function deletePantryItem(id: string) {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/pantry')
}

/** Inline quantity update (no modal needed) */
export async function updateItemQuantity(id: string, quantity: number) {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('pantry_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/pantry')
}

/** Bulk delete multiple items */
export async function bulkDeletePantryItems(ids: string[]) {
  if (ids.length === 0) return
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/pantry')
}

/** Delete from pantry + add to shopping list so you remember to restock */
export async function markAsUsedUp(
  id: string,
  name: string,
  quantity: number,
  unit: string,
  category: string
) {
  const { supabase, user } = await getUser()

  // Remove from pantry
  await supabase.from('pantry_items').delete().eq('id', id).eq('user_id', user.id)

  // Add to shopping list for restock
  await supabase.from('shopping_list_items').insert({
    user_id:  user.id,
    name,
    quantity: 1,
    unit,
    category,
    checked:  false,
    source:   'used_up',
  })

  revalidatePath('/pantry')
  revalidatePath('/shopping')
}
