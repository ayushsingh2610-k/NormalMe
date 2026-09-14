'use client'

import { useState, useTransition } from 'react'
import { logCookAction, logSaveAction } from './actions'
import type { RecipeDetail } from '@/lib/gemini'

interface Props {
  recipe: RecipeDetail
  emoji:  string
  energy: string
}

export default function RecipeClient({ recipe, emoji, energy }: Props) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [checkedSteps,       setCheckedSteps]       = useState<Set<number>>(new Set())
  const [cooked,   setCooked]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleIngredient(i: number) {
    setCheckedIngredients(s => {
      const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n
    })
  }

  function toggleStep(i: number) {
    setCheckedSteps(s => {
      const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n
    })
  }

  function handleCook() {
    startTransition(async () => {
      await logCookAction(recipe.name, recipe as object, energy)
      setCooked(true)
    })
  }

  function handleSave() {
    startTransition(async () => {
      await logSaveAction(recipe.name, recipe as object)
      setSaved(true)
    })
  }

  const allStepsDone = checkedSteps.size === recipe.steps.length && recipe.steps.length > 0

  return (
    <div style={{ padding: '20px 0 0' }}>

      {/* Back */}
      <div style={{ padding: '0 20px 16px' }}>
        <a
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          ← Back to suggestions
        </a>
      </div>

      {/* Hero */}
      <div style={{
        margin: '0 20px 24px',
        background: 'linear-gradient(135deg, var(--green-light) 0%, #F1F8E9 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{emoji}</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', color: 'var(--text-primary)' }}>
          {recipe.name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          {recipe.description}
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10, margin: '0 20px 24px',
      }}>
        {[
          { icon: '🔪', label: 'Prep',     value: `${recipe.prep_time}m` },
          { icon: '🔥', label: 'Cook',     value: `${recipe.cook_time}m` },
          { icon: '👥', label: 'Serves',   value: String(recipe.servings) },
          { icon: '⚡', label: 'Calories', value: recipe.estimated_calories ? `~${recipe.estimated_calories}` : '—' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '12px 8px', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Ingredients</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {checkedIngredients.size}/{recipe.ingredients.length} gathered
          </span>
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {recipe.ingredients.map((ing, i) => {
            const checked = checkedIngredients.has(i)
            return (
              <div
                key={i}
                onClick={() => toggleIngredient(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  background: checked ? 'var(--green-light)' : 'var(--surface)',
                  transition: 'background .18s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${checked ? 'var(--green-primary)' : 'var(--border)'}`,
                  background: checked ? 'var(--green-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  transition: 'all .18s',
                }}>
                  {checked ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: checked ? 'line-through' : 'none',
                    transition: 'all .18s',
                  }}>
                    {ing.name}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {ing.amount} {ing.unit}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Instructions</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {checkedSteps.size}/{recipe.steps.length} done
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipe.steps.map((step, i) => {
            const done = checkedSteps.has(i)
            return (
              <div
                key={i}
                onClick={() => toggleStep(i)}
                style={{
                  display: 'flex', gap: 14, padding: '14px 16px',
                  background: done ? 'var(--green-light)' : 'var(--surface)',
                  border: `1px solid ${done ? 'var(--green-chip)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', transition: 'all .18s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: done ? 'var(--green-primary)' : 'var(--surface-2)',
                  border: `2px solid ${done ? 'var(--green-primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: done ? '#fff' : 'var(--text-muted)',
                  transition: 'all .18s',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <p style={{
                  margin: 0, fontSize: 14, lineHeight: 1.6,
                  color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: done ? 'line-through' : 'none',
                  transition: 'all .18s',
                }}>
                  {step}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tips */}
      {recipe.tips && (
        <div style={{ margin: '0 20px 24px', padding: '14px 16px',
          background: '#FFF8F0', border: '1px solid #FFE0B2',
          borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--orange-warn)', marginBottom: 4 }}>
            💡 Chef's tip
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {recipe.tips}
          </p>
        </div>
      )}

      {/* Cook this / Save */}
      <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {allStepsDone && !cooked && (
          <div style={{
            padding: '12px 16px', textAlign: 'center',
            background: 'var(--green-light)', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 600, color: 'var(--green-dark)',
          }}>
            🎉 All steps done! Mark it as cooked below.
          </div>
        )}

        <button
          id="btn-mark-cooked"
          className="btn-primary"
          onClick={handleCook}
          disabled={isPending || cooked}
          style={{ background: cooked ? 'var(--green-chip)' : undefined }}
        >
          {cooked ? '✅ Marked as cooked!' : isPending ? <><div className="spinner" /> Saving…</> : '🍽️ Mark as Cooked'}
        </button>

        <button
          id="btn-save-recipe"
          onClick={handleSave}
          disabled={isPending || saved}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
            background: 'var(--surface)', border: `1.5px solid ${saved ? 'var(--green-primary)' : 'var(--border)'}`,
            color: saved ? 'var(--green-primary)' : 'var(--text-primary)',
            fontSize: 15, fontWeight: 700, cursor: saved ? 'default' : 'pointer',
          }}
        >
          {saved ? '💚 Saved to your recipes' : '🔖 Save Recipe'}
        </button>
      </div>

    </div>
  )
}
