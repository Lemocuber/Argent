import { useRef } from 'react'
import { displayDate } from '../lib.js'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const normalized = (start, span) => {
  const width = clamp(span, 4, 100)
  const left = clamp(start, 0, 100 - width)
  return { start: left, end: left + width }
}
const distance = points => Math.abs(points[0].x - points[1].x)

export function TimelineRail({ dates, range, onRange }) {
  const element = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const bounds = dates.length ? [Date.parse(`${dates[0]}T00:00:00Z`), Date.parse(`${dates.at(-1)}T00:00:00Z`)] : [0, 0]
  const extent = bounds[1] - bounds[0] || 24 * 60 * 60 * 1000
  const dateAt = percent => displayDate(new Date(bounds[0] + extent * percent / 100).toISOString().slice(0, 10))

  const resetGesture = () => {
    const points = [...pointers.current.values()]
    gesture.current = points.length === 1
      ? { type: 'pan', x: points[0].x, range }
      : points.length === 2
        ? { type: 'zoom', distance: Math.max(distance(points), 1), range }
        : null
  }
  const pointerDown = event => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX })
    resetGesture()
  }
  const pointerMove = event => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    pointers.current.set(event.pointerId, { x: event.clientX })
    const points = [...pointers.current.values()]
    const width = element.current.getBoundingClientRect().width
    if (points.length === 1 && gesture.current.type === 'pan') {
      const span = gesture.current.range.end - gesture.current.range.start
      onRange(normalized(gesture.current.range.start - (points[0].x - gesture.current.x) / width * span, span))
    } else if (points.length === 2 && gesture.current.type === 'zoom') {
      const base = gesture.current.range
      const span = (base.end - base.start) * gesture.current.distance / Math.max(distance(points), 1)
      onRange(normalized((base.start + base.end) / 2 - span / 2, span))
    }
  }
  const pointerUp = event => {
    pointers.current.delete(event.pointerId)
    resetGesture()
  }
  const wheel = event => {
    event.preventDefault()
    const rect = element.current.getBoundingClientRect()
    const span = range.end - range.start
    if (event.ctrlKey) {
      const anchor = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const nextSpan = span * Math.exp(event.deltaY * .012)
      onRange(normalized(range.start + span * anchor - nextSpan * anchor, nextSpan))
    } else onRange(normalized(range.start + (event.deltaX || event.deltaY) / rect.width * span, span))
  }

  return (
    <div ref={element} className="timeline-rail" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel}>
      <div className="timeline-rule">
        {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        <span style={{ left: `${range.start}%`, width: `${range.end - range.start}%` }} />
      </div>
      {dates.length > 0 && <div className="timeline-dates"><time>{dateAt(range.start)}</time><time>{dateAt(range.end)}</time></div>}
    </div>
  )
}
