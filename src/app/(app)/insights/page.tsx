import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InsightsClient   from './InsightsClient'

export const metadata = { title: 'Insights — NormalMe' }

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Interactions analytics ────────────────────────────────────────────────
  const { data: interactions } = await supabase
    .from('interactions')
    .select('action, context_snapshot, recipe_snapshot, rating, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = interactions ?? []

  const cookCount  = rows.filter(r => r.action === 'cook').length
  const saveCount  = rows.filter(r => r.action === 'save').length
  const viewCount  = rows.filter(r => r.action === 'view_recommendation').length
  const skipCount  = rows.filter(r => r.action === 'skip').length

  // Energy distribution
  const energyTally: Record<string, number> = { low: 0, normal: 0, high: 0 }
  rows.forEach(r => {
    const e = (r.context_snapshot as Record<string, string>)?.energy
    if (e && e in energyTally) energyTally[e]++
  })
  const topEnergy = Object.entries(energyTally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'normal'

  // Most cooked dishes (from recipe_snapshot.name)
  const dishCounts: Record<string, number> = {}
  rows
    .filter(r => r.action === 'cook' && r.recipe_snapshot)
    .forEach(r => {
      const name = (r.recipe_snapshot as Record<string, string>)?.name
      if (name) dishCounts[name] = (dishCounts[name] ?? 0) + 1
    })
  const topDishes = Object.entries(dishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Recent cook history (last 7)
  const recentCooks = rows
    .filter(r => r.action === 'cook' && r.recipe_snapshot)
    .slice(0, 7)
    .map(r => ({
      name:    (r.recipe_snapshot as Record<string, string>)?.name ?? 'Unknown',
      date:    r.created_at,
    }))

  // ── Pantry analytics ──────────────────────────────────────────────────────
  const { count: pantryCount } = await supabase
    .from('pantry_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const today = new Date().toISOString().split('T')[0]
  const { count: expiredCount } = await supabase
    .from('pantry_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lt('expiry_date', today)

  // Used-up items from shopping source (items marked as used up)
  const { count: usedUpCount } = await supabase
    .from('shopping_list_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source', 'used_up')

  // ── Shopping analytics ────────────────────────────────────────────────────
  const { count: shoppingTotal } = await supabase
    .from('shopping_list_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <InsightsClient
      stats={{
        cookCount,
        saveCount,
        viewCount,
        skipCount,
        topEnergy,
        pantryCount:   pantryCount  ?? 0,
        expiredCount:  expiredCount ?? 0,
        usedUpCount:   usedUpCount  ?? 0,
        shoppingTotal: shoppingTotal ?? 0,
      }}
      topDishes={topDishes}
      recentCooks={recentCooks}
      energyTally={energyTally}
    />
  )
}
