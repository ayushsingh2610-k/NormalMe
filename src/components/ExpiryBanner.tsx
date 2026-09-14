'use client'

import Link from 'next/link'

export type ExpiringItem = {
  id: string
  name: string
  expiry_date: string
  daysLeft: number
}

interface Props {
  items: ExpiringItem[]
}

function urgencyStyle(days: number): { bg: string; border: string; dot: string; text: string } {
  if (days <= 0) return { bg: '#FFF0F0', border: '#FFCDD2', dot: '#C62828', text: '#C62828' }
  if (days === 1) return { bg: '#FFF4E5', border: '#FFE0B2', dot: '#E65100', text: '#E65100' }
  return { bg: '#FFF8F0', border: '#FFE0B2', dot: '#F57C00', text: '#F57C00' }
}

function dayLabel(days: number) {
  if (days <= 0) return 'Expired'
  if (days === 1) return 'Tomorrow'
  return `${days}d left`
}

export default function ExpiryBanner({ items }: Props) {
  if (items.length === 0) return null

  const worst = items[0] // already sorted soonest first
  const style = urgencyStyle(worst.daysLeft)

  return (
    <div
      role="alert"
      aria-label="Expiry notification"
      style={{
        margin: '0 20px 20px',
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⏰</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: style.text }}>
              {items.length === 1
                ? '1 item expiring soon'
                : `${items.length} items expiring soon`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
              Use these before they go bad
            </div>
          </div>
        </div>
        <Link
          href="/pantry"
          style={{
            fontSize: 12, fontWeight: 700, color: style.text,
            textDecoration: 'none', padding: '5px 10px',
            background: 'rgba(0,0,0,0.06)', borderRadius: 99,
          }}
        >
          View →
        </Link>
      </div>

      {/* Item chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto' }}>
        {items.slice(0, 5).map(item => {
          const s = urgencyStyle(item.daysLeft)
          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 99, flexShrink: 0,
                background: 'rgba(255,255,255,0.7)', border: `1px solid ${s.border}`,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
              <span style={{ fontSize: 11, color: s.text, fontWeight: 700 }}>{dayLabel(item.daysLeft)}</span>
            </div>
          )
        })}
        {items.length > 5 && (
          <div style={{
            padding: '6px 12px', borderRadius: 99, flexShrink: 0,
            background: 'rgba(255,255,255,0.7)', border: `1px solid ${style.border}`,
            fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
          }}>
            +{items.length - 5} more
          </div>
        )}
      </div>
    </div>
  )
}
