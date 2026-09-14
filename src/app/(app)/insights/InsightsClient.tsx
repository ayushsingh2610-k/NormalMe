'use client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  cookCount:    number
  saveCount:    number
  viewCount:    number
  skipCount:    number
  topEnergy:   string
  pantryCount:  number
  expiredCount: number
  usedUpCount:  number
  shoppingTotal: number
}

interface Props {
  stats:        Stats
  topDishes:    { name: string; count: number }[]
  recentCooks:  { name: string; date: string }[]
  energyTally:  Record<string, number>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ENERGY_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  low:    { label: 'Low',    emoji: '🛋️', color: '#0277BD', bg: '#E1F5FE' },
  normal: { label: 'Normal', emoji: '😊', color: '#2E7D32', bg: '#E8F5E9' },
  high:   { label: 'Full',   emoji: '💪', color: '#6D4C41', bg: '#EFEBE9' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function relativeDay(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'var(--green-primary)', bg = 'var(--green-light)' }: {
  icon: string; label: string; value: number | string; sub?: string; color?: string; bg?: string
}) {
  return (
    <div style={{
      padding: '16px 14px', background: bg, borderRadius: 'var(--radius-lg)',
      border: `1px solid ${color}22`, display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, max, color }: {
  data: { label: string; value: number }[]
  max: number
  color: string
}) {
  if (data.every(d => d.value === 0)) return (
    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
      No data yet — start cooking! 🍳
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 70, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
            {d.label}
          </div>
          <div style={{ flex: 1, height: 24, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: max > 0 ? `${(d.value / max) * 100}%` : '0%',
              background: color, transition: 'width .6s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
              minWidth: d.value > 0 ? 30 : 0,
            }}>
              {d.value > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{d.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InsightsClient({ stats, topDishes, recentCooks, energyTally }: Props) {
  const totalEnergy  = Object.values(energyTally).reduce((a, b) => a + b, 0)
  const energyMax    = Math.max(...Object.values(energyTally), 1)
  const topEnergyMeta = ENERGY_META[stats.topEnergy] ?? ENERGY_META.normal

  // Waste score: 0–100 (higher = less waste)
  const wasteScore = stats.usedUpCount + stats.cookCount > 0
    ? Math.round((stats.usedUpCount / (stats.usedUpCount + (stats.expiredCount || 0))) * 100)
    : null

  return (
    <div style={{ padding: '24px 0 0' }}>

      {/* Header */}
      <div style={{ padding: '0 20px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Insights</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Your cooking journey at a glance
        </p>
      </div>

      {/* Cooking stats grid */}
      <div style={{ padding: '0 20px 20px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>Cooking activity</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard icon="🍽️" label="Meals cooked"    value={stats.cookCount}  sub="Total dishes made" />
          <StatCard icon="🔖" label="Recipes saved"   value={stats.saveCount}  sub="In your collection"
            color="#0277BD" bg="#E1F5FE" />
          <StatCard icon="🔍" label="Suggestions seen" value={stats.viewCount}  sub="AI suggestions viewed"
            color="#6D4C41" bg="#EFEBE9" />
          <StatCard icon="⏭️" label="Dishes skipped"  value={stats.skipCount}  sub="Passed on"
            color="var(--text-muted)" bg="var(--surface-2)" />
        </div>
      </div>

      {/* Pantry health */}
      <div style={{ padding: '0 20px 20px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>Pantry health</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <StatCard icon="🥫" label="In pantry"   value={stats.pantryCount}
            color="#2E7D32" bg="#E8F5E9" />
          <StatCard icon="✅" label="Used up"     value={stats.usedUpCount}  sub="Well managed"
            color="#0277BD" bg="#E1F5FE" />
          <StatCard icon="🗑️" label="Expired"    value={stats.expiredCount} sub="Goal: zero"
            color={stats.expiredCount > 0 ? 'var(--red-alert)' : 'var(--text-muted)'}
            bg={stats.expiredCount > 0 ? 'var(--red-light)' : 'var(--surface-2)'} />
        </div>

        {/* Waste score */}
        {wasteScore !== null && (
          <div style={{
            marginTop: 12, padding: '14px 16px',
            background: wasteScore >= 80 ? 'var(--green-light)' : wasteScore >= 50 ? '#FFF8F0' : 'var(--red-light)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${wasteScore >= 80 ? 'var(--green-chip)' : wasteScore >= 50 ? '#FFE0B2' : '#FFCDD2'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: wasteScore >= 80 ? 'var(--green-primary)' : wasteScore >= 50 ? 'var(--orange-warn)' : 'var(--red-alert)' }}>
              {wasteScore}%
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                {wasteScore >= 80 ? '🌟 Great waste management!' : wasteScore >= 50 ? '👍 Room to improve' : '⚠️ High food waste'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {stats.usedUpCount} used up · {stats.expiredCount} expired
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Energy distribution */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Cooking energy</h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 99,
            background: topEnergyMeta.bg, border: `1px solid ${topEnergyMeta.color}44`,
          }}>
            <span style={{ fontSize: 14 }}>{topEnergyMeta.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: topEnergyMeta.color }}>
              Favourite: {topEnergyMeta.label}
            </span>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <BarChart
            data={[
              { label: '🛋️ Low',    value: energyTally.low    ?? 0 },
              { label: '😊 Normal', value: energyTally.normal ?? 0 },
              { label: '💪 Full',   value: energyTally.high   ?? 0 },
            ]}
            max={energyMax}
            color="var(--green-primary)"
          />
          {totalEnergy > 0 && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Based on {totalEnergy} cooking session{totalEnergy !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Top dishes */}
      {topDishes.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>Most cooked</h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {topDishes.map((d, i) => (
              <div key={d.name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#FFF8DC' : 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900,
                  color: i === 0 ? '#B8860B' : 'var(--text-muted)',
                }}>
                  {i === 0 ? '🥇' : i + 1}
                </div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: 'var(--green-light)', color: 'var(--green-primary)',
                }}>
                  {d.count}×
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent cook history */}
      {recentCooks.length > 0 && (
        <div style={{ padding: '0 20px 32px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>Recent meals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentCooks.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: 20 }}>🍽️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{c.name}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {relativeDay(c.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.cookCount === 0 && stats.viewCount === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 32px 48px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No insights yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Start cooking recipes from the home screen and your stats will appear here.
          </p>
        </div>
      )}

    </div>
  )
}
