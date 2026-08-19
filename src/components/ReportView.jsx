import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { balanceOn, displayDate, entryOn, formatMoney, parseDate, priorEntry, shiftDate, TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

export function ReportView({ channels, entries, date, onDate, onAdd, onEditChannel, onEntry }) {
  const [draftDate, setDraftDate] = useState(displayDate(date))
  const track = useRef(null)
  const swipe = useRef(null)
  const pending = useRef(0)
  const animating = useRef(false)
  const transitionTimer = useRef(null)
  const blockClickUntil = useRef(0)
  useEffect(() => setDraftDate(displayDate(date)), [date])
  const commitDate = () => {
    const next = parseDate(draftDate)
    if (next) onDate(next)
    else setDraftDate(displayDate(date))
  }
  const settleSwipe = direction => {
    pending.current = direction
    animating.current = true
    track.current.style.transition = 'transform 180ms cubic-bezier(.22,.72,.28,1)'
    track.current.style.transform = `translate3d(${direction > 0 ? '-200%' : direction < 0 ? '0' : '-100%'},0,0)`
    clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(completeSwipe, 220)
  }
  const moveSwipe = event => {
    const start = swipe.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) start.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y'
    if (start.axis !== 'x') return
    event.preventDefault()
    start.dx = dx
    const width = event.currentTarget.clientWidth
    track.current.style.transform = `translate3d(calc(-100% + ${Math.max(-width, Math.min(width, dx))}px),0,0)`
  }
  const finishSwipe = event => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = start.dx ?? event.clientX - start.x
    const dy = event.clientY - start.y
    if (start.axis === 'y' || (start.axis !== 'x' && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.25))) return
    blockClickUntil.current = Date.now() + 400
    settleSwipe(Math.abs(dx) >= 48 ? dx < 0 ? 1 : -1 : 0)
  }
  const cancelSwipe = () => {
    const start = swipe.current
    swipe.current = null
    if (start?.axis !== 'x') return
    blockClickUntil.current = Date.now() + 400
    settleSwipe(Math.abs(start.dx) >= 48 ? start.dx < 0 ? 1 : -1 : 0)
  }
  const completeSwipe = () => {
    if (!animating.current) return
    clearTimeout(transitionTimer.current)
    const direction = pending.current
    pending.current = 0
    animating.current = false
    if (!direction) return
    flushSync(() => onDate(shiftDate(date, direction)))
    track.current.style.transition = 'none'
    track.current.style.transform = 'translate3d(-100%,0,0)'
  }
  const days = [shiftDate(date, -1), date, shiftDate(date, 1)]
  return (
    <section className="report-view">
      <header className="report-date">
        <button onClick={() => onDate(shiftDate(date, -1))}><Icon name="chevron_left" /></button>
        <input value={draftDate} inputMode="numeric" maxLength="10" onChange={event => setDraftDate(event.target.value)} onBlur={commitDate} onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()} />
        <button onClick={() => onDate(shiftDate(date, 1))}><Icon name="chevron_right" /></button>
      </header>
      <div className="report-body"
        onPointerDown={event => {
          if (event.pointerType === 'mouse' || animating.current) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          track.current.style.transition = 'none'
          swipe.current = { x: event.clientX, y: event.clientY, axis: null, dx: 0 }
        }}
        onPointerMove={moveSwipe}
        onPointerUp={finishSwipe}
        onPointerCancel={cancelSwipe}
        onClickCapture={event => {
          if (Date.now() < blockClickUntil.current) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}>
      <div ref={track} className="report-track" onTransitionEnd={event => event.target === event.currentTarget && completeSwipe()}>
        {days.map(day => (
          <div className="report-day" key={day}>
            <div className="channel-list">
              {channels.filter(channel => !channel.archived && (!channel.closedAt || day < channel.closedAt)).map(channel => {
                const exact = entryOn(entries, channel.id, day)
                const prior = priorEntry(entries, channel.id, day)
                const delta = exact && prior ? exact.amountCents - prior.amountCents : null
                return (
                  <div className="channel-row" key={channel.id}>
                    <button className="channel-entry" onClick={() => onEntry(channel)}>
                      <span className="channel-value">
                        <strong>{formatMoney(balanceOn(entries, channel.id, day))}</strong>
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
              <button className="add-channel-row" onClick={onAdd}><Icon name="add" /></button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
