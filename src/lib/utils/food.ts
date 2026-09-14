export function getFoodEmoji(name: string): string {
  const n = name.toLowerCase().trim()
  const map: [string, string][] = [
    ['spinach', '🥬'], ['lettuce', '🥬'], ['kale', '🥬'],
    ['tomato', '🍅'], ['tomatoes', '🍅'],
    ['egg', '🥚'], ['eggs', '🥚'],
    ['milk', '🥛'], ['cheese', '🧀'], ['butter', '🧈'], ['cream', '🍶'], ['yogurt', '🍦'], ['curd', '🍦'],
    ['bread', '🍞'], ['loaf', '🍞'],
    ['rice', '🍚'], ['pasta', '🍝'], ['noodle', '🍜'], ['flour', '🌾'],
    ['chicken', '🍗'], ['beef', '🥩'], ['mutton', '🥩'], ['pork', '🥩'], ['lamb', '🥩'], ['meat', '🥩'],
    ['fish', '🐟'], ['salmon', '🍣'], ['tuna', '🐟'], ['prawn', '🦐'], ['shrimp', '🦐'],
    ['potato', '🥔'], ['potatoes', '🥔'],
    ['onion', '🧅'], ['garlic', '🧄'],
    ['carrot', '🥕'], ['broccoli', '🥦'], ['capsicum', '🫑'], ['pepper', '🫑'],
    ['peas', '🫛'], ['corn', '🌽'], ['mushroom', '🍄'], ['cabbage', '🥬'],
    ['cucumber', '🥒'], ['zucchini', '🥒'],
    ['lemon', '🍋'], ['lime', '🍋'], ['orange', '🍊'], ['apple', '🍎'],
    ['banana', '🍌'], ['mango', '🥭'], ['grape', '🍇'], ['strawberry', '🍓'],
    ['pineapple', '🍍'], ['watermelon', '🍉'],
    ['oil', '🫙'], ['sauce', '🫙'], ['ketchup', '🍅'], ['mayo', '🫙'], ['vinegar', '🫙'],
    ['sugar', '🍬'], ['salt', '🧂'], ['spice', '🌶️'], ['chilli', '🌶️'],
    ['coffee', '☕'], ['tea', '🍵'], ['juice', '🧃'],
    ['peanut', '🥜'], ['almond', '🌰'], ['nut', '🥜'],
    ['paneer', '🧀'], ['tofu', '🧇'],
    ['coriander', '🌿'], ['mint', '🌿'], ['herb', '🌿'],
    ['can', '🥫'], ['tin', '🥫'],
    ['water', '💧'],
  ]
  for (const [key, emoji] of map) {
    if (n.includes(key)) return emoji
  }
  return '🥄'
}

export function getCategoryMeta(category: string) {
  switch (category) {
    case 'fresh':  return { label: 'Fresh',  icon: '🌿', color: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' }
    case 'frozen': return { label: 'Frozen', icon: '❄️', color: '#0277BD', bg: '#E1F5FE', border: '#81D4FA' }
    case 'pantry': return { label: 'Pantry', icon: '📦', color: '#6D4C41', bg: '#EFEBE9', border: '#BCAAA4' }
    default:       return { label: 'Other',  icon: '🫙', color: '#555',    bg: '#F5F5F5', border: '#DDD' }
  }
}
