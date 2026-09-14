import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import ShoppingClient    from './ShoppingClient'

export const metadata = { title: 'Shopping List — NormalMe' }

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('id, name, quantity, unit, category, checked, source, created_at')
    .eq('user_id', user.id)
    .order('checked',     { ascending: true })
    .order('created_at',  { ascending: false })

  return <ShoppingClient initialItems={items ?? []} />
}
