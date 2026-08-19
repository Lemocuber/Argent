import { useState } from 'react'
import { accountId, EMOJIS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function EmojiGate({ onEnter }) {
  const [sequence, setSequence] = useState([])
  const [busy, setBusy] = useState(false)

  const select = async index => {
    if (busy || sequence.length >= 12) return
    const next = [...sequence, index]
    setSequence(next)
    if (next.length === 12) {
      setBusy(true)
      try { await onEnter(accountId(next)) } catch { setSequence([]); setBusy(false) }
    }
  }

  return (
    <main className="gate">
      <div className="sequence" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} className={sequence[index] === undefined ? '' : 'chosen'}>
            {sequence[index] === undefined ? '' : EMOJIS[sequence[index]]}
          </i>
        ))}
        <button className="icon-button erase" onClick={() => setSequence(sequence.slice(0, -1))} disabled={!sequence.length || busy}>
          <Icon name="backspace" />
        </button>
      </div>
      <div className={`emoji-board${busy ? ' busy' : ''}`}>
        {EMOJIS.map((emoji, index) => (
          <button key={index} onClick={() => select(index)}>{emoji}</button>
        ))}
      </div>
    </main>
  )
}
