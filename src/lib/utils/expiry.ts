export function daysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

export function expiryLabel(days: number | null): { text: string; color: string } | null {
  if (days === null) return null
  if (days < 0)  return { text: 'Expired',  color: 'var(--red-alert)' }
  if (days === 0) return { text: 'Today!',   color: 'var(--red-alert)' }
  if (days === 1) return { text: 'Tomorrow', color: 'var(--orange-warn)' }
  if (days <= 3)  return { text: `${days} days left`, color: 'var(--orange-mid)' }
  if (days <= 7)  return { text: `${days} days left`, color: 'var(--green-primary)' }
  return { text: `${days} days left`, color: 'var(--text-muted)' }
}

/** Suggested best-before date based on item name + category */
export function suggestExpiry(name: string, category: string, purchaseDate: Date): string {
  const n = name.toLowerCase()
  let days = 7

  if (category === 'frozen') {
    days = 60
  } else if (category === 'pantry') {
    days = 90
  } else {
    // fresh heuristics
    if (/spinach|lettuce|kale|herb|coriander|mint|basil/.test(n)) days = 3
    else if (/strawberry|berry|mushroom/.test(n))                  days = 3
    else if (/chicken|beef|fish|prawn|meat|mutton/.test(n))        days = 3
    else if (/milk|yogurt|curd/.test(n))                           days = 7
    else if (/bread/.test(n))                                      days = 5
    else if (/egg/.test(n))                                        days = 21
    else if (/cheese/.test(n))                                     days = 14
    else if (/carrot|potato|onion|garlic|capsicum/.test(n))        days = 14
    else                                                           days = 7
  }

  const d = new Date(purchaseDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function yesterdayISO() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
