'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPantryItem, updatePantryItem, type PantryItemInput } from './actions'
import { getCategoryMeta } from '@/lib/utils/food'
import { suggestExpiry, todayISO, yesterdayISO } from '@/lib/utils/expiry'

const UNITS = ['unit','pack','bag','kg','g','lb','L','ml','cup','bunch','dozen','can','bottle','box','loaf','tbsp','tsp']
const STORAGE = ['Refrigerator','Freezer','Pantry shelf','Counter','Spice rack']

type Category = 'fresh' | 'frozen' | 'pantry'

interface Props {
  isOpen: boolean
  onClose: () => void
  recentNames: string[]
  editItem?: {
    id: string
    name: string; category: Category; quantity: number; unit: string
    expiry_date: string | null; storage: string; notes: string
  } | null
}

const defaultForm = (): PantryItemInput => ({
  name: '', category: 'fresh', quantity: 1, unit: 'unit',
  expiry_date: null, storage: 'Refrigerator', notes: '',
})

export default function AddGroceryModal({ isOpen, onClose, recentNames, editItem }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<PantryItemInput>(
    editItem
      ? { name: editItem.name, category: editItem.category, quantity: editItem.quantity,
          unit: editItem.unit, expiry_date: editItem.expiry_date, storage: editItem.storage, notes: editItem.notes }
      : defaultForm()
  )
  const [purchaseDate, setPurchaseDate] = useState<'today' | 'yesterday' | 'custom'>('today')
  const [customDate, setCustomDate] = useState(todayISO())
  const [autoExpiry, setAutoExpiry] = useState(true)
  const [error, setError] = useState('')

  function getPurchaseDate(): Date {
    if (purchaseDate === 'today') return new Date()
    if (purchaseDate === 'yesterday') { const d = new Date(); d.setDate(d.getDate()-1); return d }
    return new Date(customDate)
  }

  function handleNameChange(name: string) {
    const updated = { ...form, name }
    if (autoExpiry) updated.expiry_date = name ? suggestExpiry(name, form.category, getPurchaseDate()) : null
    setForm(updated)
  }

  function handleCategoryChange(cat: Category) {
    const updated = { ...form, category: cat }
    if (autoExpiry && form.name) updated.expiry_date = suggestExpiry(form.name, cat, getPurchaseDate())
    setForm(updated)
  }

  function handleSubmit() {
    if (!form.name.trim()) { setError('Please enter an item name.'); return }
    setError('')
    startTransition(async () => {
      try {
        if (editItem) {
          await updatePantryItem(editItem.id, form)
        } else {
          await addPantryItem(form)
        }
        router.refresh()
        onClose()
        setForm(defaultForm())
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  const cats: Category[] = ['fresh', 'frozen', 'pantry']

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100 }}
      />

      {/* Sheet */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:'var(--surface)',
        borderRadius:'20px 20px 0 0', zIndex:101,
        maxHeight:'92dvh', overflowY:'auto',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:99, background:'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 0' }}>
          <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>
            {editItem ? 'Edit Item' : 'Add Grocery'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'var(--text-muted)', padding:4 }}>✕</button>
        </div>

        <div style={{ padding:'16px 20px 40px', display:'flex', flexDirection:'column', gap:18 }}>

          {error && (
            <div className="form-error"><span>⚠️</span><span>{error}</span></div>
          )}

          {/* Name */}
          <div>
            <label style={lbl}>What did you buy?</label>
            <input id="modal-item-name" className="input-field" placeholder="Search ingredient…"
              value={form.name} onChange={e => handleNameChange(e.target.value)} autoFocus />
            {recentNames.length > 0 && !form.name && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Recently added</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {recentNames.map(n => (
                    <button key={n} type="button" onClick={() => handleNameChange(n)}
                      style={{ padding:'5px 12px', borderRadius:99, background:'var(--surface-2)',
                        border:'1px solid var(--border)', fontSize:13, cursor:'pointer', color:'var(--text-primary)' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity + Unit */}
          <div>
            <label style={lbl}>Quantity</label>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:0, border:'1.5px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', flex:1 }}>
                <button type="button" onClick={() => setForm(f => ({...f, quantity: Math.max(0.5, +(f.quantity - 1).toFixed(1))}))}
                  style={stepBtn}>−</button>
                <input type="number" min="0.5" step="0.5"
                  style={{ flex:1, border:'none', textAlign:'center', fontSize:16, fontWeight:600, background:'transparent', outline:'none', padding:'12px 0' }}
                  value={form.quantity} onChange={e => setForm(f => ({...f, quantity: +e.target.value}))} />
                <button type="button" onClick={() => setForm(f => ({...f, quantity: +(f.quantity + 1).toFixed(1)}))}
                  style={stepBtn}>+</button>
              </div>
              <select value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}
                style={{ width:100, ...selectStyle }}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Purchase date */}
          <div>
            <label style={lbl}>When did you buy it?</label>
            <div style={{ display:'flex', gap:8 }}>
              {(['today','yesterday','custom'] as const).map(opt => (
                <button key={opt} type="button" onClick={() => setPurchaseDate(opt)}
                  style={{
                    flex:1, padding:'9px 4px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600,
                    background: purchaseDate === opt ? 'var(--green-light)' : 'var(--surface-2)',
                    border: `1.5px solid ${purchaseDate === opt ? 'var(--green-primary)' : 'var(--border)'}`,
                    color: purchaseDate === opt ? 'var(--green-dark)' : 'var(--text-secondary)', cursor:'pointer',
                  }}>{opt.charAt(0).toUpperCase()+opt.slice(1)}</button>
              ))}
            </div>
            {purchaseDate === 'custom' && (
              <input type="date" className="input-field" value={customDate} style={{ marginTop:8 }}
                onChange={e => setCustomDate(e.target.value)} max={todayISO()} />
            )}
          </div>

          {/* Best before */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <label style={lbl}>Best before <span style={{fontWeight:400,color:'var(--text-muted)'}}>(optional)</span></label>
              <button type="button" onClick={() => setAutoExpiry(v => !v)}
                style={{ fontSize:12, color:'var(--green-primary)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                {autoExpiry ? 'Edit' : 'Auto'}
              </button>
            </div>
            {autoExpiry ? (
              <div style={{ padding:'12px 14px', background:'var(--green-light)', borderRadius:'var(--radius-sm)', fontSize:14, color:'var(--green-dark)', fontWeight:500 }}>
                📅 Auto: {form.expiry_date ?? 'Set item name first'}
              </div>
            ) : (
              <input type="date" className="input-field" value={form.expiry_date ?? ''} min={todayISO()}
                onChange={e => setForm(f => ({...f, expiry_date: e.target.value || null}))} />
            )}
          </div>

          {/* Category */}
          <div>
            <label style={lbl}>Category</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {cats.map(cat => {
                const meta = getCategoryMeta(cat)
                const active = form.category === cat
                return (
                  <button key={cat} type="button" onClick={() => handleCategoryChange(cat)}
                    style={{
                      padding:'14px 8px', borderRadius:'var(--radius-md)', display:'flex',
                      flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer',
                      background: active ? meta.bg : 'var(--surface)',
                      border: `2px solid ${active ? meta.color : 'var(--border)'}`,
                      transition:'all .18s',
                    }}>
                    <span style={{ fontSize:22 }}>{meta.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: active ? meta.color : 'var(--text-secondary)' }}>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Storage */}
          <div>
            <label style={lbl}>Storage</label>
            <select value={form.storage} onChange={e => setForm(f => ({...f, storage: e.target.value}))}
              style={{ width:'100%', ...selectStyle }}>
              {STORAGE.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes <span style={{fontWeight:400,color:'var(--text-muted)'}}>(optional)</span></label>
            <textarea className="input-field" rows={2} placeholder="Any notes…"
              style={{ resize:'none' }} value={form.notes}
              onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          </div>

          {/* Reminder info */}
          {form.expiry_date && (
            <div style={{ padding:'10px 14px', background:'var(--green-light)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--green-dark)' }}>
              🔔 We'll remind you 1 day before it goes bad ({form.expiry_date})
            </div>
          )}

          {/* Submit */}
          <button id="btn-add-grocery" className="btn-primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <><div className="spinner" /> Saving…</> : editItem ? '✅ Save Changes' : '+ Add Grocery'}
          </button>
        </div>
      </div>
    </>
  )
}

// Shared micro-styles
const lbl: React.CSSProperties = {
  display:'block', fontSize:13, fontWeight:600, color:'var(--text-secondary)', marginBottom:6,
}
const stepBtn: React.CSSProperties = {
  width:44, height:'100%', background:'var(--surface-2)', border:'none',
  fontSize:20, cursor:'pointer', color:'var(--text-primary)', fontWeight:600, padding:'12px 0',
}
const selectStyle: React.CSSProperties = {
  padding:'13px 14px', background:'var(--surface-2)', border:'1.5px solid var(--border)',
  borderRadius:'var(--radius-md)', fontSize:15, color:'var(--text-primary)',
  outline:'none', fontFamily:'inherit', cursor:'pointer',
}
