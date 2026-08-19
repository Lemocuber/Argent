import { useEffect, useMemo, useRef, useState } from 'react'
import { displayDate, entryOn, formatDelta, formatMoney, parseDate, parseMoney, priorEntry, TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function EntrySheet({ channel, date, entries, onClose, onSave, onDelete }) {
  const existing = useMemo(() => entryOn(entries, channel.id, date), [entries, channel.id, date])
  const prior = useMemo(() => priorEntry(entries, channel.id, date), [entries, channel.id, date])
  const amountInput = useRef(null)
  const [entryDate, setEntryDate] = useState(displayDate(date))
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const cents = parseMoney(amount)
  const delta = cents === null || !prior ? null : cents - prior.amountCents

  useEffect(() => {
    setEntryDate(displayDate(date))
    setAmount(existing ? formatMoney(existing.amountCents) : prior ? formatMoney(prior.amountCents) : '')
    setNote(existing?.note || '')
    requestAnimationFrame(() => amountInput.current?.focus())
  }, [date, existing, prior])

  const save = () => {
    const parsedDate = parseDate(entryDate)
    if (parsedDate && cents !== null) onSave({ channelId: channel.id, date: parsedDate, amountCents: cents, note })
  }

  return (
    <div className="sheet entry-sheet">
      <header className="sheet-bar">
        <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
        {existing && <button className="icon-button danger" onClick={() => onDelete(existing.id)}><Icon name="delete" /></button>}
        <button className="icon-button primary" onClick={save} disabled={!parseDate(entryDate) || cents === null}><Icon name="check" /></button>
      </header>
      <div className="entry-channel"><Icon name={TYPE_ICONS[channel.type]} filled />{channel.name && <b>{channel.name}</b>}</div>
      <div className="date-line">
        <Icon name="calendar_today" />
        <input value={entryDate} inputMode="numeric" onChange={event => setEntryDate(event.target.value)} maxLength="10" />
      </div>
      <div className="amount-line">
        <input ref={amountInput} value={amount} inputMode="decimal" onChange={event => setAmount(event.target.value)} />
        <output className={delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}>
          {delta === null ? <i /> : formatDelta(delta)}
        </output>
      </div>
      <div className="note-line">
        <Icon name="notes" />
        <textarea value={note} onChange={event => setNote(event.target.value)} maxLength="400" />
      </div>
    </div>
  )
}
