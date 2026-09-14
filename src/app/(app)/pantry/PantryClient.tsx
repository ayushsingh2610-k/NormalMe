'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  deletePantryItem, updateItemQuantity, bulkDeletePantryItems, markAsUsedUp,
} from './actions'
import AddGroceryModal from './AddGroceryModal'
import { getFoodEmoji, getCategoryMeta } from '@/lib/utils/food'
import { daysUntilExpiry, expiryLabel }  from '@/lib/utils/expiry'

export type PantryItem = {
  id: string; name: string; category: 'fresh' | 'frozen' | 'pantry'
  quantity: number; unit: string
  expiry_date: string | null; storage: string; notes: string; created_at: string
}

interface Props { initialItems: PantryItem[]; recentNames: string[] }

type SortKey  = 'expiry' | 'az' | 'recent' | 'category'
type FilterCat = 'all' | 'fresh' | 'frozen' | 'pantry'
const CATEGORIES = ['fresh', 'frozen', 'pantry'] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortItems(items: PantryItem[], key: SortKey): PantryItem[] {
  return [...items].sort((a, b) => {
    if (key === 'az')       return a.name.localeCompare(b.name)
    if (key === 'recent')   return b.created_at.localeCompare(a.created_at)
    if (key === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    // expiry: no-expiry items go last
    const da = a.expiry_date ?? '9999'
    const db = b.expiry_date ?? '9999'
    return da.localeCompare(db)
  })
}

// ─── ItemRow ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, menuOpen, onMenuToggle, onEdit, onDelete, onUsedUp,
  bulkMode, selected, onSelect, onQtyChange,
}: {
  item: PantryItem; menuOpen: boolean
  onMenuToggle: () => void; onEdit: () => void
  onDelete: () => void; onUsedUp: () => void
  bulkMode: boolean; selected: boolean
  onSelect: () => void; onQtyChange: (qty: number) => void
}) {
  const days = daysUntilExpiry(item.expiry_date)
  const lbl  = expiryLabel(days)
  const [localQty, setLocalQty] = useState(item.quantity)
  const [, startT] = useTransition()

  function changeQty(delta: number) {
    const next = Math.max(0.5, +(localQty + delta).toFixed(1))
    setLocalQty(next)
    startT(() => onQtyChange(next))
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
      borderTop: '1px solid var(--border)',
      background: selected ? 'var(--green-light)' : 'var(--surface)',
      transition: 'background .18s', position: 'relative',
    }}>
      {/* Bulk checkbox */}
      {bulkMode && (
        <button
          onClick={onSelect}
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            border: `2px solid ${selected ? 'var(--green-primary)' : 'var(--border)'}`,
            background: selected ? 'var(--green-primary)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 800,
          }}
        >{selected ? '✓' : ''}</button>
      )}

      {/* Emoji */}
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {getFoodEmoji(item.name)}
      </div>

      {/* Name + expiry */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 1 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: lbl?.color ?? 'var(--text-muted)' }}>
          {lbl ? lbl.text : item.storage}
        </div>
      </div>

      {/* Inline qty stepper */}
      {!bulkMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => changeQty(-1)}
            style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--border)',
              background: 'var(--surface-2)', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            −
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'var(--text-primary)' }}>
            {localQty}<span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>{item.unit}</span>
          </span>
          <button
            onClick={() => changeQty(1)}
            style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--border)',
              background: 'var(--surface-2)', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            +
          </button>
        </div>
      )}

      {/* 3-dot or select indicator */}
      {!bulkMode && (
        <div style={{ position: 'relative' }}>
          <button onClick={onMenuToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '4px 6px', fontSize: 18, lineHeight: 1 }}>
            ⋮
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              zIndex: 20, minWidth: 150, overflow: 'hidden' }}>
              <button onClick={onEdit} style={menuItemStyle}>✏️ Edit</button>
              <button onClick={onUsedUp} style={menuItemStyle}>✅ Used up</button>
              <button onClick={onDelete} style={{ ...menuItemStyle, color: 'var(--red-alert)' }}>🗑️ Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '11px 16px', background: 'none',
  border: 'none', textAlign: 'left', fontSize: 14, cursor: 'pointer',
  color: 'var(--text-primary)', fontWeight: 500,
}

// ─── Main Client ─────────────────────────────────────────────────────────────

export default function PantryClient({ initialItems, recentNames }: Props) {
  const router = useRouter()

  // UI state
  const [search,     setSearch]     = useState('')
  const [sort,       setSort]       = useState<SortKey>('expiry')
  const [filterCat,  setFilterCat]  = useState<FilterCat>('all')
  const [bulkMode,   setBulkMode]   = useState(false)
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editItem,   setEditItem]   = useState<PantryItem | null>(null)
  const [openMenu,   setOpenMenu]   = useState<string | null>(null)
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Derived
  const filtered = useMemo(() => {
    let items = initialItems
    if (search)              items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    if (filterCat !== 'all') items = items.filter(i => i.category === filterCat)
    return sortItems(items, sort)
  }, [initialItems, search, filterCat, sort])

  const useSoon = useMemo(() =>
    filtered.filter(i => { const d = daysUntilExpiry(i.expiry_date); return d !== null && d <= 3 })
      .sort((a, b) => (a.expiry_date ?? '').localeCompare(b.expiry_date ?? '')),
  [filtered])

  const byCategory = useMemo(() => {
    const map: Record<string, PantryItem[]> = { fresh: [], frozen: [], pantry: [] }
    filtered.forEach(i => { if (i.category in map) map[i.category].push(i) })
    return map
  }, [filtered])

  const total = initialItems.length

  // Handlers
  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleExpand(cat: string) {
    setExpanded(s => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n })
  }

  const handleDelete = useCallback((id: string) => {
    setDeletingIds(s => new Set(s).add(id))
    setOpenMenu(null)
    startTransition(async () => {
      await deletePantryItem(id)
      router.refresh()
      setDeletingIds(s => { const n = new Set(s); n.delete(id); return n })
    })
  }, [router])

  const handleUsedUp = useCallback((item: PantryItem) => {
    setDeletingIds(s => new Set(s).add(item.id))
    setOpenMenu(null)
    startTransition(async () => {
      await markAsUsedUp(item.id, item.name, item.quantity, item.unit, item.category)
      router.refresh()
      setDeletingIds(s => { const n = new Set(s); n.delete(item.id); return n })
    })
  }, [router])

  function handleBulkDelete() {
    const ids = [...selected]
    setDeletingIds(new Set(ids))
    startTransition(async () => {
      await bulkDeletePantryItems(ids)
      router.refresh()
      setSelected(new Set())
      setBulkMode(false)
      setDeletingIds(new Set())
    })
  }

  function handleQtyChange(id: string, qty: number) {
    startTransition(() => updateItemQuantity(id, qty).then(() => router.refresh()))
  }

  function openEdit(item: PantryItem) {
    setEditItem(item); setOpenMenu(null); setModalOpen(true)
  }

  function openAdd() {
    setEditItem(null); setModalOpen(true)
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'expiry',   label: 'Expiry' },
    { key: 'az',       label: 'A–Z'    },
    { key: 'recent',   label: 'Recent' },
    { key: 'category', label: 'Type'   },
  ]

  const CAT_FILTERS: { key: FilterCat; label: string; emoji: string }[] = [
    { key: 'all',    label: 'All',    emoji: '🗂️' },
    { key: 'fresh',  label: 'Fresh',  emoji: '🌿' },
    { key: 'frozen', label: 'Frozen', emoji: '❄️' },
    { key: 'pantry', label: 'Pantry', emoji: '📦' },
  ]

  return (
    <div style={{ padding: '20px 0 0', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>My Pantry</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {total} {total === 1 ? 'item' : 'items'} · {useSoon.length > 0 ? `${useSoon.length} expiring soon` : 'all good'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setBulkMode(v => !v); setSelected(new Set()) }}
            style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700,
              background: bulkMode ? 'var(--red-light)' : 'var(--surface-2)',
              border: `1px solid ${bulkMode ? '#FFCDD2' : 'var(--border)'}`,
              color: bulkMode ? 'var(--red-alert)' : 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {bulkMode ? '✕ Cancel' : '☑ Select'}
          </button>
        </div>
      </div>

      {/* Search + Add */}
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }}>🔍</span>
          <input id="pantry-search" className="input-field" placeholder="Search groceries…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38, paddingTop: 11, paddingBottom: 11 }} />
        </div>
        <button id="btn-open-add-grocery" onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px',
            background: 'var(--green-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0 }}>
          + Add
        </button>
      </div>

      {/* Category filter tabs */}
      <div style={{ padding: '0 20px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {CAT_FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilterCat(f.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 99, whiteSpace: 'nowrap',
              background: filterCat === f.key ? 'var(--green-primary)' : 'var(--surface-2)',
              border: `1.5px solid ${filterCat === f.key ? 'var(--green-primary)' : 'var(--border)'}`,
              color: filterCat === f.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .18s',
            }}>
            <span>{f.emoji}</span><span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Sort:</span>
        {SORT_OPTIONS.map(s => (
          <button key={s.key} onClick={() => setSort(s.key)}
            style={{
              padding: '5px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: sort === s.key ? 'var(--green-light)' : 'transparent',
              border: `1px solid ${sort === s.key ? 'var(--green-primary)' : 'var(--border)'}`,
              color: sort === s.key ? 'var(--green-dark)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all .15s',
            }}>{s.label}</button>
        ))}
      </div>

      {/* Use Soon */}
      {useSoon.length > 0 && filterCat === 'all' && !search && (
        <div style={{ margin: '0 20px 16px', padding: '14px 16px', background: '#FFF8F0', border: '1px solid #FFE0B2', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>⏰</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Use Soon</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— {useSoon.length} {useSoon.length === 1 ? 'item' : 'items'}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {useSoon.map(item => {
              const lbl = expiryLabel(daysUntilExpiry(item.expiry_date))
              return (
                <div key={item.id} style={{ minWidth: 80, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 28, marginBottom: 3 }}>{getFoodEmoji(item.name)}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                  {lbl && <div style={{ fontSize: 11, color: lbl.color, fontWeight: 700, marginTop: 2 }}>{lbl.text}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🥫</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Your pantry is empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px' }}>
            Add your first grocery to get started.
          </p>
          <button className="btn-primary" onClick={openAdd} style={{ width: 'auto', padding: '13px 28px' }}>
            + Add Grocery
          </button>
        </div>
      )}

      {/* No search/filter results */}
      {total > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15 }}>No items match your filters</p>
        </div>
      )}

      {/* Category sections (shown when not sorting flat) */}
      {sort === 'category' || filterCat !== 'all'
        ? (
          /* Flat list when filtering by category or sorted by type */
          <div style={{ margin: '0 20px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {filtered.map(item => (
              <ItemRow key={item.id} item={item}
                menuOpen={openMenu === item.id}
                onMenuToggle={() => setOpenMenu(id => id === item.id ? null : item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item.id)}
                onUsedUp={() => handleUsedUp(item)}
                bulkMode={bulkMode}
                selected={selected.has(item.id)}
                onSelect={() => toggleSelect(item.id)}
                onQtyChange={qty => handleQtyChange(item.id, qty)}
              />
            ))}
          </div>
        )
        : (
          /* Grouped by category */
          CATEGORIES.map(cat => {
            const items = byCategory[cat]
            if (items.length === 0) return null
            const meta = getCategoryMeta(cat)
            const isExpanded = expanded.has(cat)
            const SHOW = 4
            const visible = isExpanded ? items : items.slice(0, SHOW)

            return (
              <div key={cat} style={{ margin: '0 20px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <button onClick={() => toggleExpand(cat)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--surface)', border: 'none', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{meta.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: meta.bg, color: meta.color }}>
                      {items.length}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{isExpanded ? '∧' : '∨'}</span>
                </button>

                {visible.map(item => (
                  <ItemRow key={item.id} item={item}
                    menuOpen={openMenu === item.id}
                    onMenuToggle={() => setOpenMenu(id => id === item.id ? null : item.id)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    onUsedUp={() => handleUsedUp(item)}
                    bulkMode={bulkMode}
                    selected={selected.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                    onQtyChange={qty => handleQtyChange(item.id, qty)}
                  />
                ))}

                {items.length > SHOW && (
                  <button onClick={() => toggleExpand(cat)}
                    style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none',
                      borderTop: '1px solid var(--border)', color: 'var(--green-primary)', fontWeight: 600,
                      fontSize: 13, cursor: 'pointer' }}>
                    {isExpanded ? '∧ Show less' : `∨ Show all ${items.length} items`}
                  </button>
                )}
              </div>
            )
          })
        )
      }

      {/* Modal */}
      <AddGroceryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null) }}
        recentNames={recentNames}
        editItem={editItem}
      />

      {/* Tap-away to close context menu */}
      {openMenu && <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />}

      {/* Bulk action footer */}
      {bulkMode && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)', maxWidth: 390,
          background: 'var(--text-primary)', borderRadius: 'var(--radius-lg)',
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,.25)', zIndex: 60,
        }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            {selected.size} {selected.size === 1 ? 'item' : 'items'} selected
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setSelected(new Set(filtered.map(i => i.id)))}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,.15)',
                border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                background: selected.size > 0 ? 'var(--red-alert)' : 'rgba(255,255,255,.2)',
                border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: selected.size > 0 ? 'pointer' : 'default' }}>
              🗑️ Delete {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
