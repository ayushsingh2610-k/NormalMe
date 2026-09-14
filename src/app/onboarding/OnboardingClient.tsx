'use client'

import { useState, useTransition } from 'react'
import { saveOnboarding, skipOnboarding } from './actions'

// ─── Data ────────────────────────────────────────────────────────────────────

const SKILL_OPTIONS = [
  {
    id: 'beginner',
    emoji: '🌱',
    label: 'Beginner',
    desc: 'Simple recipes, minimal techniques',
  },
  {
    id: 'home_cook',
    emoji: '🍳',
    label: 'Home Cook',
    desc: 'Comfortable with everyday cooking',
  },
  {
    id: 'experienced',
    emoji: '👨‍🍳',
    label: 'Experienced',
    desc: 'Confident with complex dishes',
  },
]

const DIET_OPTIONS = [
  { id: 'none', emoji: '🍽️', label: 'No preference' },
  { id: 'vegetarian', emoji: '🥦', label: 'Vegetarian' },
  { id: 'vegan', emoji: '🌱', label: 'Vegan' },
  { id: 'pescatarian', emoji: '🐟', label: 'Pescatarian' },
  { id: 'keto', emoji: '🥑', label: 'Keto' },
  { id: 'halal', emoji: '☪️', label: 'Halal' },
  { id: 'jain', emoji: '🫘', label: 'Jain' },
]

const ALLERGEN_OPTIONS = [
  { id: 'nuts', emoji: '🥜', label: 'Nuts' },
  { id: 'dairy', emoji: '🧀', label: 'Dairy' },
  { id: 'gluten', emoji: '🌾', label: 'Gluten' },
  { id: 'eggs', emoji: '🥚', label: 'Eggs' },
  { id: 'soy', emoji: '🫘', label: 'Soy' },
  { id: 'shellfish', emoji: '🦐', label: 'Shellfish' },
  { id: 'fish', emoji: '🐟', label: 'Fish' },
  { id: 'sesame', emoji: '🌰', label: 'Sesame' },
]

const TOTAL_STEPS = 4

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 20 : 7,
            height: 7,
            borderRadius: 99,
            background: i === step
              ? 'var(--green-primary)'
              : i < step
                ? 'var(--green-chip)'
                : 'var(--border)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

function SelectionCard({
  selected,
  onClick,
  children,
  style,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px',
        background: selected ? 'var(--green-light)' : 'var(--surface)',
        border: `2px solid ${selected ? 'var(--green-primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        textAlign: 'left',
        position: 'relative',
        ...style,
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--green-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#fff', fontWeight: 700,
        }}>
          ✓
        </div>
      )}
      {children}
    </button>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepSkill({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍴</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
          What's your cooking skill?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          We'll tailor recipes to your comfort level.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SKILL_OPTIONS.map(opt => (
          <SelectionCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingRight: 24 }}>
              <span style={{ fontSize: 28 }}>{opt.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {opt.desc}
                </div>
              </div>
            </div>
          </SelectionCard>
        ))}
      </div>
    </div>
  )
}

function StepDiet({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
          Any dietary preferences?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          We'll only suggest meals that fit your diet.
        </p>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}>
        {DIET_OPTIONS.map(opt => (
          <SelectionCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            style={{ textAlign: 'center', padding: '18px 12px' }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>{opt.emoji}</div>
            <div style={{
              fontWeight: 600, fontSize: 13,
              color: value === opt.id ? 'var(--green-dark)' : 'var(--text-primary)',
              paddingRight: 0,
            }}>
              {opt.label}
            </div>
          </SelectionCard>
        ))}
      </div>
    </div>
  )
}

function StepAllergens({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter(x => x !== id) : [...value, id]
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
          Any allergies to avoid?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          These are hard-filtered from every recommendation.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {ALLERGEN_OPTIONS.map(opt => {
          const active = value.includes(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: active ? 'var(--red-light)' : 'var(--surface)',
                border: `2px solid ${active ? 'var(--red-alert)' : 'var(--border)'}`,
                borderRadius: 99,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--red-alert)' : 'var(--text-primary)',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>

      {value.length === 0 && (
        <p style={{
          textAlign: 'center', marginTop: 24,
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          Tap items above to mark them — or leave empty if you have none.
        </p>
      )}

      {value.length > 0 && (
        <div style={{
          marginTop: 20, padding: '12px 14px',
          background: 'var(--red-light)', borderRadius: 'var(--radius-sm)',
          border: '1px solid #FFCDD2',
        }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--red-alert)', fontWeight: 600 }}>
            🚫 Avoiding: {value.map(id => ALLERGEN_OPTIONS.find(o => o.id === id)?.label).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

function StepHousehold({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
          How many people are you cooking for?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          We'll scale recipe portions to fit your household.
        </p>
      </div>

      {/* Stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        margin: '40px 0',
      }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          style={{
            width: 52, height: 52,
            borderRadius: '50%',
            background: value <= 1 ? 'var(--border)' : 'var(--green-light)',
            border: `2px solid ${value <= 1 ? 'var(--border)' : 'var(--green-primary)'}`,
            fontSize: 22, color: value <= 1 ? 'var(--text-muted)' : 'var(--green-primary)',
            cursor: value <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
            fontWeight: 700,
          }}
        >
          −
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 64, fontWeight: 800,
            color: 'var(--green-primary)',
            lineHeight: 1,
            minWidth: 80,
          }}>
            {value}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            {value === 1 ? 'person' : 'people'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(10, value + 1))}
          disabled={value >= 10}
          style={{
            width: 52, height: 52,
            borderRadius: '50%',
            background: value >= 10 ? 'var(--border)' : 'var(--green-light)',
            border: `2px solid ${value >= 10 ? 'var(--border)' : 'var(--green-primary)'}`,
            fontSize: 22, color: value >= 10 ? 'var(--text-muted)' : 'var(--green-primary)',
            cursor: value >= 10 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
            fontWeight: 700,
          }}
        >
          +
        </button>
      </div>

      {/* Quick-select pills */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              padding: '8px 18px',
              borderRadius: 99,
              background: value === n ? 'var(--green-primary)' : 'var(--surface)',
              border: `1.5px solid ${value === n ? 'var(--green-primary)' : 'var(--border)'}`,
              color: value === n ? '#fff' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {n === 6 ? '6+' : n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingClient({ userName }: { userName: string }) {
  const [step, setStep] = useState(0)
  const [skillLevel, setSkillLevel] = useState('home_cook')
  const [dietType, setDietType] = useState('none')
  const [allergens, setAllergens] = useState<string[]>([])
  const [householdSize, setHouseholdSize] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [isSkipping, setIsSkipping] = useState(false)

  function next() {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  function handleSkip() {
    setIsSkipping(true)
    startTransition(async () => {
      await skipOnboarding()
    })
  }

  function handleFinish() {
    startTransition(async () => {
      await saveOnboarding({
        skill_level: skillLevel,
        diet_type: dietType,
        allergens,
        household_size: householdSize,
      })
    })
  }

  const firstName = userName.split(' ')[0] || 'there'

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        paddingBottom: 8,
      }}>
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0',
            }}
          >
            ← Back
          </button>
        ) : (
          <div style={{ width: 60 }} />
        )}

        <ProgressDots step={step} />

        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending || isSkipping}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
            padding: '8px 0',
          }}
        >
          {isSkipping ? '…' : 'Skip'}
        </button>
      </div>

      {/* Welcome banner on first step */}
      {step === 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--green-light)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>👋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green-dark)' }}>
              Hey {firstName}! Let's personalise your experience.
            </div>
            <div style={{ fontSize: 12, color: 'var(--green-primary)', marginTop: 2 }}>
              Takes about 30 seconds. You can always change these later.
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div style={{ flex: 1, paddingTop: step === 0 ? 0 : 20 }}>
        {step === 0 && (
          <StepSkill value={skillLevel} onChange={setSkillLevel} />
        )}
        {step === 1 && (
          <StepDiet value={dietType} onChange={setDietType} />
        )}
        {step === 2 && (
          <StepAllergens value={allergens} onChange={setAllergens} />
        )}
        {step === 3 && (
          <StepHousehold value={householdSize} onChange={setHouseholdSize} />
        )}
      </div>

      {/* Footer navigation */}
      <div style={{ paddingTop: 24, paddingBottom: 40 }}>
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={next}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleFinish}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <div className="spinner" />
                Saving…
              </>
            ) : (
              "Let's Get Cooking!"
            )}
          </button>
        )}

        <p style={{
          textAlign: 'center', fontSize: 12,
          color: 'var(--text-muted)', marginTop: 14,
        }}>
          {step < TOTAL_STEPS - 1
            ? `Step ${step + 1} of ${TOTAL_STEPS}`
            : 'You can update these anytime in your profile.'}
        </p>
      </div>
    </div>
  )
}
