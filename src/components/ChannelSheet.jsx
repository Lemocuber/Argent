import { useEffect, useState } from 'react'
import { displayDate, parseDate, TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function ChannelSheet({ channel, date, onClose, onSave, onDelete, onCloseAt }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('cash')
  const [deleting, setDeleting] = useState(false)
  const [deleteMode, setDeleteMode] = useState(null)
  const [closeDate, setCloseDate] = useState(displayDate(date))

  useEffect(() => {
    setName(channel?.name || '')
    setType(channel?.type || 'cash')
    setDeleting(false)
    setDeleteMode(null)
    setCloseDate(displayDate(date))
  }, [channel, date])

  const remove = mode => {
    if (deleteMode !== mode) return setDeleteMode(mode)
    if (mode === 'all') onDelete()
    else {
      const value = parseDate(closeDate)
      if (value) onCloseAt(value)
    }
  }

  return (
    <div className="sheet channel-sheet">
      <header className="sheet-bar">
        <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
        {channel && <button className={`icon-button danger ${deleting ? 'active' : ''}`} onClick={() => { setDeleting(!deleting); setDeleteMode(null) }}>
          <Icon name={deleting ? 'close' : 'delete'} />
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
      {deleting && <div className={`delete-options ${channel.closedAt ? 'single' : ''}`}>
        <div className="delete-options-inner">
          <button className={deleteMode === 'all' ? 'armed' : ''} onClick={() => remove('all')}><Icon name={deleteMode === 'all' ? 'warning' : 'delete_forever'} /></button>
          {!channel.closedAt && <div className={deleteMode === 'since' ? 'armed' : ''}>
            <button onClick={() => remove('since')}><Icon name={deleteMode === 'since' ? 'warning' : 'event_busy'} /></button>
            <input value={closeDate} inputMode="numeric" maxLength="10" onChange={event => { setCloseDate(event.target.value); setDeleteMode(null) }} />
          </div>}
        </div>
      </div>}
    </div>
  )
}
