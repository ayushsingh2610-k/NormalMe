'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchRecommendations, logInteraction } from './home-actions'
import type { DishSuggestion, ContextSnapshot } from './home-actions'

// ─── Types ───────────────────────────────────────────────────────────────────

type Energy = 'low' | 'normal' | 'high'

interface Props {
  pantryCount: number
  expiringCount: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ENERGY_OPTIONS: { id: Energy; label: string; emoji: string; desc: string }[] = [
  { id: 'low',    label: 'Low',    emoji: '🛋️', desc: '≤20 min' },
  { id: 'normal', label: 'Normal', emoji: '😊', desc: '20–45 min' },
  { id: 'high',   label: 'Full',   emoji: '💪', desc: '45+ min' },
]

// ─── Dish Card ───────────────────────────────────────────────────────────────

function DishCard({
  dish,
  context,
  onClick,
}: {
  dish: DishSuggestion
  context: ContextSnapshot
  onClick: () => void
}) {
  const effortColor = {
    easy:     'var(--green-primary)',
    moderate: 'var(--orange-mid)',
    complex:  'var(--red-alert)',
  }[dish.effort]

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex', gap: 14, padding: '14px 16px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', transition: 'box-shadow .2s, transform .15s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Match score bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        height: 3, width: `${dish.match_score}%`,
        background: 'linear-gradient(90deg, var(--green-primary), var(--green-mid))',
        borderRadius: '0 0 4px 0',
      }} />

      {/* Emoji */}
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-md)',
        background: 'var(--green-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, flexShrink: 0,
      }}>
        {dish.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {dish.name}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-primary)', flexShrink: 0 }}>
            {dish.match_score}%
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 6px', lineHeight: 1.4 }}>
          {dish.reason}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ⏱ {dish.estimated_minutes} min
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
            background: `${effortColor}18`, color: effortColor,
          }}>
            {dish.effort}
          </span>
          {dish.uses_expiring && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
              background: '#FFF4E5', color: 'var(--orange-warn)',
            }}>
              ⚠️ uses expiring
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--surface-2)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 16, width: '60%', background: 'var(--surface-2)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: '90%', background: 'var(--surface-2)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: '40%', background: 'var(--surface-2)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomeClient({ pantryCount, expiringCount }: Props) {
  const router = useRouter()
  const [energy, setEnergy]         = useState<Energy>('normal')
  const [dishes, setDishes]         = useState<DishSuggestion[]>([])
  const [loaded, setLoaded]         = useState(false)
  const [error, setError]           = useState('')
  const [isPending, startTransition] = useTransition()

  const context: ContextSnapshot = {
    energy,
    expiring_item_count: expiringCount,
    pantry_item_count: pantryCount,
  }

  function loadRecommendations(e: Energy) {
    setError('')
    startTransition(async () => {
      try {
        const result = await fetchRecommendations(e)
        setDishes(result.suggestions)
        setLoaded(true)
      } catch {
        setError('Could not load suggestions. Please try again.')
        setLoaded(true)
      }
    })
  }

  // Auto-load on mount
  useEffect(() => {
    loadRecommendations('normal')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEnergyChange(e: Energy) {
    setEnergy(e)
    setLoaded(false)
    loadRecommendations(e)
  }

  function handleDishClick(dish: DishSuggestion) {
    // Log click interaction (fire-and-forget)
    logInteraction('click_dish', dish, context).catch(() => {})
    // Navigate to recipe page (Feature 6)
    router.push(`/recipe?dish=${encodeURIComponent(dish.name)}&emoji=${encodeURIComponent(dish.emoji)}`)
  }

  return (
    <div>
      {/* Energy selector */}
      <div style={{ padding: '0 20px 20px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
          What's your energy today?
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          We'll match recipes to how much effort you want to put in.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {ENERGY_OPTIONS.map(opt => {
            const active = energy === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleEnergyChange(opt.id)}
                style={{
                  padding: '12px 8px', borderRadius: 'var(--radius-md)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: active ? 'var(--green-light)' : 'var(--surface)',
                  border: `2px solid ${active ? 'var(--green-primary)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all .18s',
                }}
              >
                <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--green-dark)' : 'var(--text-primary)' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: 10, color: active ? 'var(--green-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
                  {opt.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Suggestions section */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
            Suggested for you
          </h2>
          <button
            onClick={() => { setLoaded(false); loadRecommendations(energy) }}
            disabled={isPending}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'var(--green-primary)',
              padding: 0, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {isPending ? '…' : '↻ Refresh'}
          </button>
        </div>

        {/* Empty pantry nudge */}
        {pantryCount === 0 && !isPending && (
          <div style={{
            padding: '20px', textAlign: 'center',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)',
            border: '1.5px dashed var(--border)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🥫</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Pantry is empty</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
              Add items to your pantry to get personalised recipe suggestions.
            </p>
            <a href="/pantry" style={{
              display: 'inline-block', padding: '10px 20px',
              background: 'var(--green-primary)', color: '#fff',
              borderRadius: 99, fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>+ Add to Pantry</a>
          </div>
        )}

        {/* Error */}
        {error && !isPending && (
          <div style={{
            padding: '14px 16px', background: 'var(--red-light)',
            borderRadius: 'var(--radius-md)', border: '1px solid #FFCDD2',
            fontSize: 14, color: 'var(--red-alert)', marginBottom: 12,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeletons */}
        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Dish cards */}
        {!isPending && loaded && dishes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dishes.map((dish, i) => (
              <DishCard
                key={`${dish.name}-${i}`}
                dish={dish}
                context={context}
                onClick={() => handleDishClick(dish)}
              />
            ))}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              AI-powered suggestions based on your pantry · Tap a dish to get the full recipe
            </p>
          </div>
        )}

        {/* No results */}
        {!isPending && loaded && dishes.length === 0 && pantryCount > 0 && (
          <div style={{
            padding: '20px', textAlign: 'center',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤔</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>No suggestions yet</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Try refreshing or adding more pantry items.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
