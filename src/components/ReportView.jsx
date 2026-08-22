import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { loadChannelOrder, reconcileChannelOrder, saveChannelOrder } from '../channelOrder.js'
import { balanceOn, displayDate, entryOn, formatDelta, formatMoney, parseDate, priorEntry, shiftDate, today, TYPE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

const visibleOn = (channels, day) => channels.filter(channel => !channel.archived && (!channel.closedAt || day < channel.closedAt))

const moveVisible = (order, visible, from, to) => {
  const shown = order.filter(id => visible.has(id))
  const start = shown.indexOf(from)
  const end = shown.indexOf(to)
  if (start < 0 || end < 0 || start === end) return order
  shown.splice(end, 0, shown.splice(start, 1)[0])
  let index = 0
  return order.map(id => visible.has(id) ? shown[index++] : id)
}

const SortRow = ({ channel, ghost, onPointerDown }) => (
  <div className={`channel-row sort-row${ghost ? ' sort-placeholder' : ''}`} data-sort-id={channel.id}
    onPointerDown={onPointerDown}>
    <span className="channel-id">
      <i><Icon name={TYPE_ICONS[channel.type]} /></i>
      {channel.name && <b>{channel.name}</b>}
    </span>
    <i className="sort-grip"><Icon name="drag_indicator" /></i>
  </div>
)

export function ReportView({ account, channels, entries, date, onDate, onAdd, onEditChannel, onEntry }) {
  const [draftDate, setDraftDate] = useState(displayDate(date))
  const [order, setOrder] = useState(() => loadChannelOrder(account, channels))
  const [sortMode, setSortMode] = useState(false)
  const [drag, setDrag] = useState(null)
  const track = useRef(null)
  const swipe = useRef(null)
  const orderRef = useRef(order)
  const dragRef = useRef(null)
  const addPress = useRef({ timer: null, suppressUntil: 0, x: 0, y: 0 })
  const pending = useRef(0)
  const animating = useRef(false)
  const transitionTimer = useRef(null)
  const blockClickUntil = useRef(0)
  const lastDate = today()
  const canNext = date < lastDate
  useEffect(() => setDraftDate(displayDate(date)), [date])
  useEffect(() => {
    setOrder(current => {
      const next = reconcileChannelOrder(current, channels) || channels.map(channel => channel.id)
      orderRef.current = next
      return next
    })
  }, [channels])
  useEffect(() => () => clearTimeout(addPress.current.timer), [])
  const orderedChannels = order.map(id => channels.find(channel => channel.id === id)).filter(Boolean)
  const visibleIds = new Set(visibleOn(orderedChannels, date).map(channel => channel.id))
  const commitDate = () => {
    const next = parseDate(draftDate)
    if (next && next <= lastDate) onDate(next)
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
    if (Math.hypot(dx, dy) > 20) cancelAddPress()
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) start.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y'
    if (start.axis !== 'x') return
    event.preventDefault()
    start.dx = canNext || dx >= 0 ? dx : 0
    const width = event.currentTarget.clientWidth
    track.current.style.transform = `translate3d(calc(-100% + ${Math.max(-width, Math.min(width, start.dx))}px),0,0)`
  }
  const finishSwipe = event => {
    endAddPress()
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
    endAddPress()
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
  const beginAddPress = event => {
    if (sortMode) return
    Object.assign(addPress.current, { suppressUntil: 0, x: event.clientX, y: event.clientY })
    addPress.current.timer = setTimeout(() => {
      addPress.current.suppressUntil = Infinity
      swipe.current = null
      track.current.style.transform = 'translate3d(-100%,0,0)'
      setSortMode(true)
      navigator.vibrate?.(24)
    }, 520)
  }
  const cancelAddPress = () => {
    clearTimeout(addPress.current.timer)
    addPress.current.timer = null
  }
  const endAddPress = () => {
    cancelAddPress()
    if (addPress.current.suppressUntil === Infinity) addPress.current.suppressUntil = performance.now() + 100
  }
  const moveAddPress = event => {
    if (Math.hypot(event.clientX - addPress.current.x, event.clientY - addPress.current.y) > 20) cancelAddPress()
  }
  const useAdd = event => {
    cancelAddPress()
    if (performance.now() < addPress.current.suppressUntil) {
      addPress.current.suppressUntil = 0
      event.preventDefault()
      return
    }
    if (sortMode) {
      setSortMode(false)
      return
    }
    onAdd()
  }
  const beginDrag = (event, channel) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const row = event.currentTarget
    const list = row.parentElement
    const rowBox = row.getBoundingClientRect()
    const listBox = list.getBoundingClientRect()
    const scale = rowBox.height / row.offsetHeight || 1
    list.setPointerCapture?.(event.pointerId)
    dragRef.current = { id: channel.id, list, grab: (event.clientY - rowBox.top) / scale, moved: false }
    setDrag({ id: channel.id, top: (rowBox.top - listBox.top) / scale, height: row.offsetHeight })
  }
  const moveDrag = event => {
    const active = dragRef.current
    if (!active) return
    event.preventDefault()
    const listBox = active.list.getBoundingClientRect()
    const scale = listBox.width / active.list.offsetWidth || 1
    const scroller = active.list.parentElement
    if (event.clientY < scroller.getBoundingClientRect().top + 48) scroller.scrollTop -= 10
    else if (event.clientY > scroller.getBoundingClientRect().bottom - 48) scroller.scrollTop += 10
    setDrag(current => current && { ...current, top: Math.max(0, Math.min(active.list.scrollHeight - current.height, (event.clientY - active.list.getBoundingClientRect().top) / scale - active.grab)) })
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-sort-id]')
    const targetId = Number(target?.dataset.sortId)
    if (!targetId || targetId === active.id || !visibleIds.has(targetId)) return
    setOrder(current => {
      const next = moveVisible(current, visibleIds, active.id, targetId)
      active.moved ||= next !== current
      orderRef.current = next
      return next
    })
  }
  const finishDrag = event => {
    const active = dragRef.current
    if (!active) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = null
    setDrag(null)
    if (active.moved) saveChannelOrder(account, orderRef.current, channels)
  }
  const days = [shiftDate(date, -1), date, shiftDate(date, 1)]
  return (
    <section className="report-view">
      <header className="report-date">
        <button onClick={() => onDate(shiftDate(date, -1))}><Icon name="chevron_left" /></button>
        <input value={draftDate} inputMode="numeric" maxLength="10" onChange={event => setDraftDate(event.target.value)} onBlur={commitDate} onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()} />
        <button disabled={!canNext} onClick={() => onDate(shiftDate(date, 1))}><Icon name="chevron_right" /></button>
      </header>
      <div className={`report-body${sortMode ? ' sorting' : ''}`}
        onPointerDown={event => {
          if (sortMode || event.pointerType === 'mouse' || animating.current) return
          if (!event.target.closest?.('.add-channel-row')) event.currentTarget.setPointerCapture?.(event.pointerId)
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
            <div className="channel-list"
              onPointerMove={sortMode && day === date ? moveDrag : undefined}
              onPointerUp={sortMode && day === date ? finishDrag : undefined}
              onPointerCancel={sortMode && day === date ? finishDrag : undefined}>
              {visibleOn(orderedChannels, day).map(channel => {
                if (sortMode) return <SortRow key={channel.id} channel={channel} ghost={drag?.id === channel.id && day === date}
                  onPointerDown={day === date ? event => beginDrag(event, channel) : undefined} />
                const exact = entryOn(entries, channel.id, day)
                const prior = priorEntry(entries, channel.id, day)
                const delta = exact && prior ? exact.amountCents - prior.amountCents : null
                return (
                  <div className="channel-row" key={channel.id}>
                    <button className="channel-entry" onClick={() => onEntry(channel)}>
                      <span className="channel-value">
                        <strong>{formatMoney(balanceOn(entries, channel.id, day))}</strong>
                        <small className={delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}>
                          {delta !== null ? formatDelta(delta) : !exact ? <i /> : null}
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
              {drag && day === date && <div className="channel-row sort-row sort-overlay" style={{ top: drag.top, height: drag.height }}>
                <span className="channel-id">
                  <i><Icon name={TYPE_ICONS[channels.find(channel => channel.id === drag.id)?.type]} /></i>
                  {channels.find(channel => channel.id === drag.id)?.name && <b>{channels.find(channel => channel.id === drag.id).name}</b>}
                </span>
                <i className="sort-grip"><Icon name="drag_indicator" /></i>
              </div>}
              <button className={`add-channel-row${sortMode ? ' sorting-done' : ''}`}
                onPointerDown={beginAddPress} onPointerMove={moveAddPress} onPointerUp={endAddPress} onPointerCancel={endAddPress}
                onPointerLeave={event => event.pointerType === 'mouse' && endAddPress()}
                onClick={useAdd}><Icon name={sortMode ? 'check' : 'add'} /></button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
