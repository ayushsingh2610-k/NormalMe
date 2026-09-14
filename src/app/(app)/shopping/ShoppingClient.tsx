'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  addShoppingItem, toggleShoppingItem, deleteShoppingItem,
  clearCheckedItems, buyCheckedItems,
} from './actions'
import type { ShoppingItem } from './actions'

// ─── Constants ───────────────────────────────────────────────────────────────

const CAT_OPTIONS = [
  { key: 'fresh',  label: 'Fresh',  emoji: '🌿', color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'frozen', label: 'Frozen', emoji: '❄️', color: '#0277BD', bg: '#E1F5FE' },
  { key: 'pantry', label: 'Pantry', emoji: '📦', color: '#6D4C41', bg: '#EFEBE9' },
]

const UNITS = ['unit','pack','kg','g','L','ml','bag','bunch','can','bottle','box','dozen']

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ShoppingRow({
  item, onToggle, onDelete,
}: {
  item: ShoppingItem
  onToggle: (checked: boolean) => void
  onDelete: () => void
}) {
  const cat = CAT_OPTIONS.find(c => c.key === item.category) ?? CAT_OPTIONS[2]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: item.checked ? 'var(--surface-2)' : 'var(--surface)',
      borderTop: '1px solid var(--border)',
      opacity: item.checked ? 0.65 : 1,
      transition: 'all .2s',
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(!item.checked)}
        aria-checked={item.checked}
        role="checkbox"
        style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          border: `2px solid ${item.checked ? 'var(--green-primary)' : 'var(--border)'}`,
          background: item.checked ? 'var(--green-primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 800, transition: 'all .18s',
        }}
      >{item.checked ? '✓' : ''}</button>

      {/* Category dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: cat.color, flexShrink: 0,
      }} />

      {/* Name + qty */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
          textDecoration: item.checked ? 'line-through' : 'none',
          transition: 'all .2s',
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
          {item.quantity} {item.unit}
          {item.source !== 'manual' && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: cat.color }}>
              {item.source === 'used_up' ? '🔄 from pantry' : `📋 ${item.source}`}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '4px', fontSize: 16, lineHeight: 1 }}
        aria-label={`Remove ${item.name}`}
      >✕</button>
    </div>
  )
}

// ─── Quick Add Form ────────────────────────────────────────────────────────

function QuickAddForm({ onAdd }: { onAdd: (name: string, qty: number, unit: string, cat: string) => void }) {
  const [name,    setName]    = useState('')
  const [qty,     setQty]     = useState(1)
  const [unit,    setUnit]    = useState('unit')
  const [cat,     setCat]     = useState('pantry')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), qty, unit, cat)
    setName('')
    setQty(1)
    setUnit('unit')
    setExpanded(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{
      margin: '0 20px 20px',
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        <input
          ref={inputRef}
          id="shopping-add-input"
          className="input-field"
          placeholder="Add item…"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ flex: 1, margin: 0, paddingTop: 10, paddingBottom: 10 }}
        />
        <button
          onClick={submit}
          disabled={!name.trim()}
          style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: name.trim() ? 'var(--green-primary)' : 'var(--surface-2)',
            border: 'none', color: name.trim() ? '#fff' : 'var(--text-muted)',
            fontSize: 20, cursor: name.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .18s',
          }}
        >+</button>
      </div>

      {/* Expanded options */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {/* Qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flex: 1 }}>
              <button onClick={() => setQty(q => Math.max(0.5, +(q-1).toFixed(1)))}
                style={{ padding: '8px 10px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>−</button>
              <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{qty}</span>
              <button onClick={() => setQty(q => +(q+1).toFixed(1))}
                style={{ padding: '8px 10px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>+</button>
            </div>
            {/* Unit */}
            <select value={unit} onChange={e => setUnit(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {CAT_OPTIONS.map(c => (
              <button key={c.key} onClick={() => setCat(c.key)}
                style={{
                  flex: 1, padding: '7px 4px', borderRadius: 'var(--radius-sm)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  background: cat === c.key ? c.bg : 'var(--surface-2)',
                  border: `1.5px solid ${cat === c.key ? c.color : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all .15s',
                }}>
                <span style={{ fontSize: 16 }}>{c.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: cat === c.key ? c.color : 'var(--text-muted)' }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShoppingClient({ initialItems }: { initialItems: ShoppingItem[] }) {
  const router = useRouter()
  const [items, setItems]             = useState(initialItems)
  const [isPending, startTransition]  = useTransition()
  const [buySuccess, setBuySuccess]   = useState(false)

  // Keep in sync when page re-validates
  useEffect(() => { setItems(initialItems) }, [initialItems])

  const unchecked = useMemo(() => items.filter(i => !i.checked), [items])
  const checked   = useMemo(() => items.filter(i => i.checked),  [items])

  function optimistic(id: string, update: Partial<ShoppingItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...update } : i))
  }

  function handleToggle(id: string, val: boolean) {
    optimistic(id, { checked: val })
    startTransition(() => toggleShoppingItem(id, val).then(() => router.refresh()))
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    startTransition(() => deleteShoppingItem(id).then(() => router.refresh()))
  }

  function handleAdd(name: string, qty: number, unit: string, cat: string) {
    const tmp: ShoppingItem = {
      id: `tmp-${Date.now()}`, name, quantity: qty, unit, category: cat,
      checked: false, source: 'manual', created_at: new Date().toISOString(),
    }
    setItems(prev => [tmp, ...prev])
    startTransition(() => addShoppingItem(name, qty, unit, cat).then(() => router.refresh()))
  }

  function handleClearChecked() {
    setItems(prev => prev.filter(i => !i.checked))
    startTransition(() => clearCheckedItems().then(() => router.refresh()))
  }

  function handleBuyAll() {
    startTransition(async () => {
      await buyCheckedItems(items)
      setBuySuccess(true)
      router.refresh()
      setTimeout(() => setBuySuccess(false), 3000)
    })
  }

  const total = items.length

  return (
    <div style={{ padding: '20px 0 0' }}>

      {/* Header */}
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Shopping List</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {unchecked.length} to buy · {checked.length} done
          </p>
        </div>
        {checked.length > 0 && (
          <button
            onClick={handleBuyAll}
            disabled={isPending}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--green-primary)', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            🛒 Add to Pantry
          </button>
        )}
      </div>

      {/* Buy success toast */}
      {buySuccess && (
        <div style={{
          margin: '0 20px 16px', padding: '12px 16px',
          background: 'var(--green-light)', border: '1px solid var(--green-chip)',
          borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, color: 'var(--green-dark)',
        }}>
          ✅ {checked.length} item{checked.length !== 1 ? 's' : ''} added to your pantry!
        </div>
      )}

      {/* Quick Add */}
      <QuickAddForm onAdd={handleAdd} />

      {/* Empty state */}
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Your list is empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Add items above, or mark pantry items as "used up" to auto-suggest them here.
          </p>
        </div>
      )}

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <div style={{ margin: '0 20px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              TO BUY ({unchecked.length})
            </span>
            <button
              onClick={() => unchecked.forEach(i => handleToggle(i.id, true))}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >Check all</button>
          </div>
          {unchecked.map(item => (
            <ShoppingRow
              key={item.id} item={item}
              onToggle={checked => handleToggle(item.id, checked)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div style={{ margin: '0 20px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              DONE ({checked.length})
            </span>
            <button
              onClick={handleClearChecked}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--red-alert)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >Clear all</button>
          </div>
          {checked.map(item => (
            <ShoppingRow
              key={item.id} item={item}
              onToggle={c => handleToggle(item.id, c)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      {total > 0 && (
        <div style={{ padding: '0 20px 32px', display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {CAT_OPTIONS.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
