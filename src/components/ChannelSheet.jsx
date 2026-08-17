import { useEffect, useState } from 'react'
import { TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function ChannelSheet({ channel, onClose, onSave, onDelete }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('cash')
  const [deleteStep, setDeleteStep] = useState(0)

  useEffect(() => {
    setName(channel?.name || '')
    setType(channel?.type || 'cash')
    setDeleteStep(0)
  }, [channel])

  return (
    <div className="sheet channel-sheet">
      <header className="sheet-bar">
        <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
        {channel && <button className={`icon-button danger delete-step-${deleteStep}`} onClick={() => deleteStep < 2 ? setDeleteStep(deleteStep + 1) : onDelete()}>
          <Icon name={deleteStep === 0 ? 'delete' : deleteStep === 1 ? 'warning' : 'delete_forever'} />
        </button>}
        <button className="icon-button primary" onClick={() => onSave({ name, type })}><Icon name="check" /></button>
      </header>
      <div className="channel-name">
        <Icon name={TYPE_ICONS[type]} filled />
        <input value={name} onChange={event => setName(event.target.value)} autoFocus maxLength="48" />
      </div>
      <div className="type-switch">
        <div className="type-switch-inner">
          {Object.entries(TYPE_ICONS).map(([value, icon]) => (
            <button key={value} className={type === value ? 'active' : ''} onClick={() => setType(value)}><Icon name={icon} filled={type === value} /></button>
          ))}
        </div>
      </div>
    </div>
  )
}
