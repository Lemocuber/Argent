export const CHANNEL_ORDER_KEY = 'argent.channelOrder'

const idsFor = channels => channels.map(channel => channel.id)
const clear = () => {
  try { localStorage.removeItem(CHANNEL_ORDER_KEY) } catch {}
}

export const reconcileChannelOrder = (saved, channels) => {
  const fallback = idsFor(channels)
  if (!Array.isArray(saved) || saved.some(id => !Number.isSafeInteger(id)) || new Set(saved).size !== saved.length) return null
  const known = new Set(fallback)
  const retained = saved.filter(id => known.has(id))
  if (saved.length && fallback.length && !retained.length) return null
  return [...retained, ...fallback.filter(id => !retained.includes(id))]
}

export const loadChannelOrder = (account, channels) => {
  const fallback = idsFor(channels)
  try {
    const saved = JSON.parse(localStorage.getItem(CHANNEL_ORDER_KEY))
    if (!saved || saved.account !== account) throw new Error()
    const order = reconcileChannelOrder(saved.ids, channels)
    if (!order) throw new Error()
    return order
  } catch {
    clear()
    return fallback
  }
}

export const saveChannelOrder = (account, order, channels) => {
  const fallback = idsFor(channels)
  if (order.length !== fallback.length || order.some(id => !fallback.includes(id)) || new Set(order).size !== order.length) {
    clear()
    return false
  }
  try {
    if (order.every((id, index) => id === fallback[index])) clear()
    else localStorage.setItem(CHANNEL_ORDER_KEY, JSON.stringify({ account, ids: order }))
    return true
  } catch {
    clear()
    return false
  }
}

export const clearChannelOrder = clear
