import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let expiringCount = 0
  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const threeDaysOut = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0]
    const { count } = await supabase
      .from('pantry_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('expiry_date', threeDaysOut)
      .gte('expiry_date', today)
    expiringCount = count ?? 0
  }

  return (
    <>
      <main className="page-scroll">
        {children}
      </main>
      <BottomNav expiringCount={expiringCount} />
    </>
  )
}
