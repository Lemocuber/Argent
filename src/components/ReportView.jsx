import { useEffect, useState } from 'react'
import { balanceOn, displayDate, entryOn, formatMoney, parseDate, priorEntry, shiftDate, TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function ReportView({ channels, entries, date, onDate, onAdd, onEditChannel, onEntry }) {
  const [draftDate, setDraftDate] = useState(displayDate(date))
  useEffect(() => setDraftDate(displayDate(date)), [date])
  const commitDate = () => {
    const next = parseDate(draftDate)
    if (next) onDate(next)
    else setDraftDate(displayDate(date))
  }

  return (
    <section className="report-view">
      <header className="report-date">
        <button onClick={() => onDate(shiftDate(date, -1))}><Icon name="chevron_left" /></button>
        <input value={draftDate} inputMode="numeric" maxLength="10" onChange={event => setDraftDate(event.target.value)} onBlur={commitDate} onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()} />
        <button onClick={() => onDate(shiftDate(date, 1))}><Icon name="chevron_right" /></button>
        <button className="add-channel" onClick={onAdd}><Icon name="add" /></button>
      </header>
      <div className="channel-list">
        {channels.filter(channel => !channel.archived).map(channel => {
          const exact = entryOn(entries, channel.id, date)
          const prior = priorEntry(entries, channel.id, date)
          const delta = exact && prior ? exact.amountCents - prior.amountCents : null
          return (
            <div className="channel-row" key={channel.id}>
              <button className="channel-entry" onClick={() => onEntry(channel)}>
                <span className="channel-value">
                  <strong>{formatMoney(balanceOn(entries, channel.id, date))}</strong>
                  <small className={delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}>
                    {delta !== null ? <>{delta > 0 ? '+' : ''}{formatMoney(delta)}</> : !exact ? <i /> : null}
                  </small>
                </span>
              </button>
              <button className="channel-id" onClick={() => onEditChannel(channel)}>
                <i><Icon name={TYPE_ICONS[channel.type]} /></i>
                {channel.name && <b>{channel.name}</b>}
              </button>
            </div>
          )
        })}
        {!channels.filter(channel => !channel.archived).length && <button className="empty-list" onClick={onAdd}><Icon name="add" /></button>}
      </div>
    </section>
  )
}
