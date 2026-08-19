export const EMOJIS = [
  '😀','😎','🥳','🤓','🥹','😤','🤠','🥶',
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼',
  '🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔',
  '🦄','🐝','🦋','🐌','🐞','🐢','🐙','🦀',
  '🐬','🐳','🦜','🦩','🌵','🌲','🍀','🍄',
  '🌞','🌛','⭐','🌈','🔥','💧','❄️','⚡',
  '🍎','🍋','🍉','🍇','🍓','🥝','🥑','🥕',
  '🌽','🥐','🍞','🧀','🍕','🍜','🍙','🍪',
  '☕','🧋','🍺','🍷','⚽','🏀','🎾','🛹',
  '🎸','🎹','🎲','🎯','🚲','🚗','✈️','🚀',
  '⌚','📷','💡','🔑','🧲','🧸','🎁','💎',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍'
]

export const TYPE_ICONS = { cash: 'payments', savings: 'savings', accrued: 'schedule' }
export const MODE_ICONS = { cash: 'payments', total: 'account_balance', net: 'all_inclusive' }

export const accountId = indexes => indexes.map(index => index.toString(36).padStart(2, '0')).join('')
export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const shiftDate = (date, amount) => {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + amount)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}
export const displayDate = date => date?.replaceAll('-', '/') || ''
export const parseDate = value => {
  const normalized = value.replaceAll('/', '-')
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) && !Number.isNaN(Date.parse(`${normalized}T00:00:00`)) ? normalized : null
}
export const formatMoney = cents => (cents / 100).toLocaleString('en-US', {
  minimumFractionDigits: Math.abs(cents) % 100 ? 2 : 0,
  maximumFractionDigits: 2
})
export const formatAxisMoney = cents => {
  const amount = Math.abs(Math.round(cents)) / 100
  const fit = (value, unit) => [2, 1, 0].map(precision => `${Number(value.toFixed(precision))}${unit}`).find(label => label.length <= 4)
  const value = [[1, ''], [1e3, 'K'], [1e6, 'M'], [1e9, 'B'], [1e12, 'T']].map(([size, unit]) => fit(amount / size, unit)).find(Boolean) || '0'
  return `${cents < 0 ? '-' : ''}${value}`
}
export const formatDelta = cents => cents === 0 ? '±0' : `${cents > 0 ? '+' : ''}${formatMoney(cents)}`
export const parseMoney = value => {
  const normalized = value.replaceAll(',', '').trim()
  return /^-?(?:\d+|\d*\.\d{1,2})$/.test(normalized) && Number.isSafeInteger(Math.round(Number(normalized) * 100))
    ? Math.round(Number(normalized) * 100)
    : null
}
export const priorEntry = (entries, channelId, date) => entries
  .filter(entry => entry.channelId === channelId && entry.date < date)
  .sort((a, b) => b.date.localeCompare(a.date))[0]
export const entryOn = (entries, channelId, date) => entries.find(entry => entry.channelId === channelId && entry.date === date)
export const balanceOn = (entries, channelId, date) => entries
  .filter(entry => entry.channelId === channelId && entry.date <= date)
  .sort((a, b) => b.date.localeCompare(a.date))[0]?.amountCents ?? 0
