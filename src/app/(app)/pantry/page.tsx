import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import PantryClient      from '@/app/(app)/pantry/PantryClient'

export const metadata = { title: 'My Pantry — NormalMe' }

export default async function PantryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: recentNames } = await supabase
    .from('pantry_items')
    .select('name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const uniqueRecent = [...new Set((recentNames ?? []).map(r => r.name))].slice(0, 5)

  return (
    <PantryClient
      initialItems={items ?? []}
      recentNames={uniqueRecent}
    />
  )
}
