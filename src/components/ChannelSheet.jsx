import { useEffect, useState } from 'react'
import { CHANNEL_EMOJIS, TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function ChannelSheet({ channel, onClose, onSave }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(CHANNEL_EMOJIS[0])
  const [type, setType] = useState('cash')

  useEffect(() => {
    setName(channel?.name || '')
    setEmoji(channel?.emoji || CHANNEL_EMOJIS[0])
    setType(channel?.type || 'cash')
  }, [channel])

  return (
    <div className="sheet channel-sheet">
      <header className="sheet-bar">
        <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
        <button className="icon-button primary" onClick={() => onSave({ name, emoji, type })}><Icon name="check" /></button>
      </header>
      <div className="channel-name">
        <span>{emoji}</span>
        <input value={name} onChange={event => setName(event.target.value)} autoFocus maxLength="48" />
      </div>
      <div className="channel-emojis">
        {CHANNEL_EMOJIS.map(value => <button key={value} className={emoji === value ? 'active' : ''} onClick={() => setEmoji(value)}>{value}</button>)}
      </div>
      <div className="type-switch">
        {Object.entries(TYPE_ICONS).map(([value, icon]) => (
          <button key={value} className={type === value ? 'active' : ''} onClick={() => setType(value)}><Icon name={icon} filled={type === value} /></button>
        ))}
      </div>
    </div>
  )
}
