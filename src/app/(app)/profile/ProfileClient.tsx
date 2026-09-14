'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updatePreferences, signOut, deleteAccount } from './actions'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProfileData {
  displayName:  string
  email:        string
  avatarUrl:    string | null
  provider:     string
  skill_level:  string
  diet_type:    string
  allergens:    string[]
  household_size: number
  memberSince:  string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SKILLS   = ['beginner', 'home_cook', 'intermediate', 'advanced']
const DIETS    = ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'gluten_free', 'dairy_free']
const ALLERGENS_LIST = ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish', 'sesame']

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Beginner 🌱', home_cook: 'Home Cook 🍳',
  intermediate: 'Intermediate 👨‍🍳', advanced: 'Advanced 🌟',
}
const DIET_LABELS: Record<string, string> = {
  none: 'No restriction', vegetarian: 'Vegetarian 🥗', vegan: 'Vegan 🌱',
  pescatarian: 'Pescatarian 🐟', keto: 'Keto', paleo: 'Paleo',
  gluten_free: 'Gluten-free', dairy_free: 'Dairy-free',
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 20px 20px' }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1,
        textTransform: 'uppercase', margin: '0 0 10px' }}>{title}</h2>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children, danger = false }: { label: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600,
        color: danger ? 'var(--red-alert)' : 'var(--text-primary)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfileClient({ data }: { data: ProfileData }) {
  const [displayName,   setDisplayName]   = useState(data.displayName)
  const [skill,         setSkill]         = useState(data.skill_level)
  const [diet,          setDiet]          = useState(data.diet_type)
  const [allergens,     setAllergens]     = useState<string[]>(data.allergens)
  const [household,     setHousehold]     = useState(data.household_size)
  const [saved,         setSaved]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition]      = useTransition()

  function toggleAllergen(a: string) {
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateProfile(displayName)
      await updatePreferences({ skill_level: skill, diet_type: diet, allergens, household_size: household })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  function handleSignOut() {
    startTransition(() => signOut())
  }

  function handleDelete() {
    startTransition(() => deleteAccount())
  }

  const memberYear = new Date(data.memberSince).getFullYear()

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--surface-2)', fontSize: 13, color: 'var(--text-primary)',
    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ padding: '24px 0 0' }}>

      {/* Avatar + Name */}
      <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--green-primary), var(--green-mid))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: '#fff', fontWeight: 800,
          boxShadow: 'var(--shadow-md)',
        }}>
          {data.avatarUrl
            ? <img src={data.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : displayName.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {data.displayName || data.email}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {data.email} · Member since {memberYear}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5,
            padding: '3px 8px', borderRadius: 99,
            background: 'var(--green-light)', border: '1px solid var(--green-chip)',
          }}>
            <span style={{ fontSize: 10 }}>
              {data.provider === 'google' ? '🔷' : '📧'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-dark)' }}>
              {data.provider === 'google' ? 'Google account' : 'Email account'}
            </span>
          </div>
        </div>
      </div>

      {/* Account section */}
      <Section title="Account">
        <Row label="Display name">
          <input
            className="input-field"
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); setSaved(false) }}
            style={{ margin: 0, padding: '8px 10px', maxWidth: 180, fontSize: 13 }}
          />
        </Row>
        <Row label="Email">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.email}</span>
        </Row>
      </Section>

      {/* Cooking preferences */}
      <Section title="Cooking preferences">
        <Row label="Skill level">
          <select value={skill} onChange={e => { setSkill(e.target.value); setSaved(false) }} style={selectStyle}>
            {SKILLS.map(s => <option key={s} value={s}>{SKILL_LABELS[s]}</option>)}
          </select>
        </Row>
        <Row label="Diet">
          <select value={diet} onChange={e => { setDiet(e.target.value); setSaved(false) }} style={selectStyle}>
            {DIETS.map(d => <option key={d} value={d}>{DIET_LABELS[d]}</option>)}
          </select>
        </Row>
        <Row label="Household">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => { setHousehold(h => Math.max(1, h - 1)); setSaved(false) }}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)',
                background: 'var(--surface-2)', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 15, minWidth: 24, textAlign: 'center' }}>{household}</span>
            <button onClick={() => { setHousehold(h => Math.min(10, h + 1)); setSaved(false) }}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)',
                background: 'var(--surface-2)', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {household === 1 ? 'person' : 'people'}
            </span>
          </div>
        </Row>
        {/* Allergens */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
            Allergens to avoid
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALLERGENS_LIST.map(a => {
              const active = allergens.includes(a)
              return (
                <button key={a} onClick={() => toggleAllergen(a)}
                  style={{
                    padding: '6px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                    background: active ? 'var(--red-light)' : 'var(--surface-2)',
                    border: `1.5px solid ${active ? 'var(--red-alert)' : 'var(--border)'}`,
                    color: active ? 'var(--red-alert)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all .15s',
                    textTransform: 'capitalize',
                  }}>
                  {active ? '✕ ' : ''}{a}
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Save button */}
      <div style={{ padding: '0 20px 20px' }}>
        <button
          id="btn-save-profile"
          className="btn-primary"
          onClick={handleSave}
          disabled={isPending}
          style={{ background: saved ? 'var(--green-chip)' : undefined }}
        >
          {saved ? '✅ Saved!' : isPending ? <><div className="spinner" /> Saving…</> : 'Save changes'}
        </button>
      </div>

      {/* Account actions */}
      <Section title="Account actions">
        <div style={{ borderTop: 'none' }}>
          <Row label="Sign out">
            <button onClick={handleSignOut} disabled={isPending}
              style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)',
                border: '1px solid var(--border)', fontSize: 13, fontWeight: 600,
                color: 'var(--text-primary)', cursor: 'pointer' }}>
              Sign out
            </button>
          </Row>
          <Row label="Delete account" danger>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--red-light)', border: '1px solid #FFCDD2',
                  fontSize: 13, fontWeight: 600, color: 'var(--red-alert)', cursor: 'pointer' }}>
                Delete…
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isPending}
                  style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--red-alert)', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Confirm delete
                </button>
              </div>
            )}
          </Row>
        </div>
      </Section>

      <div style={{ height: 32 }} />
    </div>
  )
}
