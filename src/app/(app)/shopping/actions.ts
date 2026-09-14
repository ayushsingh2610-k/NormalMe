'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  checked: boolean
  source: string
  created_at: string
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function addShoppingItem(
  name: string,
  quantity = 1,
  unit = 'unit',
  category = 'pantry',
  source = 'manual'
) {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('shopping_list_items').insert({
    user_id: user.id,
    name: name.trim(),
    quantity,
    unit,
    category,
    checked: false,
    source,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/shopping')
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ checked })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/shopping')
}

export async function deleteShoppingItem(id: string) {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/shopping')
}

export async function clearCheckedItems() {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', user.id)
    .eq('checked', true)
  if (error) throw new Error(error.message)
  revalidatePath('/shopping')
}

/** Buy checked items: move them to pantry + remove from shopping list */
export async function buyCheckedItems(items: ShoppingItem[]) {
  const { supabase, user } = await getUser()
  const toAdd = items.filter(i => i.checked)
  if (toAdd.length === 0) return

  // Add to pantry
  const pantryRows = toAdd.map(i => ({
    user_id:     user.id,
    name:        i.name,
    category:    i.category === 'fresh' || i.category === 'frozen' ? i.category : 'pantry',
    quantity:    i.quantity,
    unit:        i.unit,
    expiry_date: null,
    storage:     'Pantry shelf',
    notes:       '',
  }))
  await supabase.from('pantry_items').insert(pantryRows)

  // Remove from shopping list
  const ids = toAdd.map(i => i.id)
  await supabase.from('shopping_list_items').delete().in('id', ids).eq('user_id', user.id)

  revalidatePath('/shopping')
  revalidatePath('/pantry')
  revalidatePath('/')
}

/** Undo — re-add a single item */
export async function updateShoppingItem(
  id: string,
  updates: Partial<Pick<ShoppingItem, 'name' | 'quantity' | 'unit' | 'category'>>
) {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('shopping_list_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/shopping')
}
