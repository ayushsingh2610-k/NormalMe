import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ExpiryBanner, { type ExpiringItem } from '@/components/ExpiryBanner'
import HomeClient from './HomeClient'
import { daysUntilExpiry } from '@/lib/utils/expiry'

export const metadata = { title: 'Home — NormalMe' }

function greeting(name: string): string {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${time}, ${name.split(' ')[0]}! 👋`
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

  // Fetch expiring items (≤3 days)
  const threeDaysOut = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0]
  const { data: rawExpiring } = await supabase
    .from('pantry_items')
    .select('id, name, expiry_date')
    .eq('user_id', user.id)
    .lte('expiry_date', threeDaysOut)
    .order('expiry_date', { ascending: true })

  const expiringItems: ExpiringItem[] = (rawExpiring ?? [])
    .map(item => ({
      id: item.id,
      name: item.name,
      expiry_date: item.expiry_date,
      daysLeft: daysUntilExpiry(item.expiry_date) ?? 999,
    }))
    .filter(i => i.daysLeft <= 3)

  // Pantry summary
  const { data: summary } = await supabase
    .from('pantry_items')
    .select('category')
    .eq('user_id', user.id)

  const counts = (summary ?? []).reduce(
    (acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc },
    {} as Record<string, number>
  )
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ padding: '24px 0 0' }}>

      {/* Header */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--green-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🥗</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-primary)', letterSpacing: 0.5 }}>
              NormalMe
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {greeting(name)}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {total > 0
              ? `You have ${total} item${total !== 1 ? 's' : ''} in your pantry`
              : 'Start by adding items to your pantry'}
          </p>
        </div>
      </div>

      {/* Expiry Banner */}
      <ExpiryBanner items={expiringItems} />

      {/* Pantry at a glance */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Pantry at a glance</h2>
          <Link href="/pantry" style={{ fontSize: 13, color: 'var(--green-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Manage →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Fresh',  icon: '🌿', key: 'fresh',  color: '#2E7D32', bg: '#E8F5E9' },
            { label: 'Frozen', icon: '❄️', key: 'frozen', color: '#0277BD', bg: '#E1F5FE' },
            { label: 'Pantry', icon: '📦', key: 'pantry', color: '#6D4C41', bg: '#EFEBE9' },
          ].map(cat => (
            <Link key={cat.key} href="/pantry" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 12px', borderRadius: 'var(--radius-md)',
                background: cat.bg, border: `1px solid ${cat.color}22`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: cat.color }}>
                  {counts[cat.key] ?? 0}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: cat.color, marginTop: 2 }}>
                  {cat.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Energy selector + AI recommendations */}
      <HomeClient pantryCount={total} expiringCount={expiringItems.length} />

    </div>
  )
}
