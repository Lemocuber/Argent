export const GRAPH_MODE_KEY = 'argent.graphMode'

const modes = new Set(['cash', 'total', 'net'])

export const clearGraphMode = () => {
  try { localStorage.removeItem(GRAPH_MODE_KEY) } catch {}
}

export const loadGraphMode = () => {
  try {
    const mode = localStorage.getItem(GRAPH_MODE_KEY)
    if (mode === null || modes.has(mode)) return mode || 'net'
  } catch {}
  clearGraphMode()
  return 'net'
}

export const saveGraphMode = mode => {
  if (!modes.has(mode)) {
    clearGraphMode()
    return 'net'
  }
  try { localStorage.setItem(GRAPH_MODE_KEY, mode) } catch { clearGraphMode() }
  return mode
}
