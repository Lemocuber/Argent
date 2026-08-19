import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { DataZoomInsideComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { displayDate, formatDelta, formatMoney, MODE_ICONS, shiftDate, today } from '../lib.js'
import { Icon } from './Icon.jsx'
import { TimelineRail } from './TimelineRail.jsx'

echarts.use([LineChart, DataZoomInsideComponent, GridComponent, TooltipComponent, CanvasRenderer])

const typesFor = mode => mode === 'cash' ? ['cash'] : mode === 'total' ? ['cash', 'savings'] : ['cash', 'savings', 'accrued']
const escape = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

const pointsFor = (channels, entries, mode) => {
  const included = channels.filter(channel => !channel.archived && typesFor(mode).includes(channel.type))
  const cutoffs = new Map(included.map(channel => [channel.id, channel.closedAt]))
  const relevant = entries.filter(entry => cutoffs.has(entry.channelId) && (!cutoffs.get(entry.channelId) || entry.date <= cutoffs.get(entry.channelId))).sort((a, b) => a.date.localeCompare(b.date))
  if (!relevant.length) return []
  const daily = relevant.reduce((map, entry) => map.set(entry.date, [...(map.get(entry.date) || []), entry]), new Map())
  const balances = new Map(included.map(channel => [channel.id, 0]))
  const names = new Map(included.map(channel => [channel.id, channel.name || '']))
  const points = []
  const end = relevant.at(-1).date > today() ? relevant.at(-1).date : today()
  for (let date = relevant[0].date; date <= end; date = shiftDate(date, 1)) {
    const changes = daily.get(date) || []
    const details = changes.map(entry => ({
      name: names.get(entry.channelId),
      note: entry.note,
      delta: entry.amountCents - balances.get(entry.channelId),
      closed: cutoffs.get(entry.channelId) === date
    })).filter(detail => detail.delta || detail.note || detail.closed)
    changes.forEach(entry => balances.set(entry.channelId, entry.amountCents))
    const amount = [...balances.values()].reduce((sum, value) => sum + value, 0)
    points.push({
      value: [date, amount],
      amount,
      delta: points.length ? amount - points.at(-1).amount : null,
      details
    })
  }
  return points
}

export function BalanceChart({ channels, entries, mode, onMode, onEmpty }) {
  const element = useRef(null)
  const chart = useRef(null)
  const points = useMemo(() => pointsFor(channels, entries, mode), [channels, entries, mode])
  const [range, setRange] = useState({ start: 0, end: 100 })
  const current = points.at(-1)?.amount || 0
  const domain = `${points[0]?.value[0] || ''}:${points.at(-1)?.value[0] || ''}`

  useEffect(() => setRange({ start: 0, end: 100 }), [domain])

  useEffect(() => {
    chart.current = echarts.init(element.current, null, { renderer: 'canvas' })
    const resize = new ResizeObserver(() => chart.current?.resize())
    resize.observe(element.current)
    return () => { resize.disconnect(); chart.current?.dispose() }
  }, [])

  useEffect(() => {
    chart.current?.setOption({
      useUTC: true,
      animationDuration: 520,
      animationEasing: 'cubicOut',
      grid: { left: 10, right: 10, top: 22, bottom: 10, containLabel: true },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        minInterval: 24 * 60 * 60 * 1000,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false }
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#d6d4ce', width: 1 } },
        axisLabel: { color: '#111', fontFamily: 'Azeret Mono Variable', fontSize: 10, formatter: value => formatMoney(Math.round(value)) }
      },
      dataZoom: [{ id: 'timeline', type: 'inside', filterMode: 'none', start: range.start, end: range.end, disabled: true, zoomOnMouseWheel: false, moveOnMouseMove: false, moveOnMouseWheel: false, preventDefaultMouseMove: false }],
      tooltip: {
        trigger: 'axis',
        triggerOn: 'mousemove|click',
        axisPointer: {
          type: 'line',
          snap: true,
          lineStyle: { color: '#111', width: 1, type: 'dashed' },
          label: { show: false }
        },
        confine: true,
        backgroundColor: '#f7f6f1',
        borderColor: '#111',
        borderWidth: 1,
        padding: [14, 16],
        textStyle: { color: '#111', fontFamily: 'Azeret Mono Variable', fontSize: 12 },
        extraCssText: 'box-shadow:none;border-radius:0;min-width:230px;max-width:min(340px,calc(100vw - 32px))',
        formatter: params => {
          const point = Array.isArray(params) ? params[0]?.data : params.data
          if (!point) return ''
          const delta = point.delta === null ? '' : `<span class="node-delta ${point.delta > 0 ? 'up' : point.delta < 0 ? 'down' : ''}">${formatDelta(point.delta)}</span>`
          const details = point.details.map(detail => `<div class="node-note"><b>${detail.name ? `<span class="${detail.closed ? 'closed' : ''}">${escape(detail.name)}</span>` : ''}<em class="${detail.delta > 0 ? 'up' : detail.delta < 0 ? 'down' : ''}">${formatDelta(detail.delta)}</em></b>${detail.note ? `<i>${escape(detail.note)}</i>` : ''}</div>`).join('')
          return `<div class="node-detail"><time>${displayDate(point.value[0])}</time><div class="node-balance"><strong>${formatMoney(point.amount)}</strong>${delta}</div>${details}</div>`
        }
      },
      series: [{
        type: 'line',
        data: points,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#111', width: 1.5 },
        itemStyle: { color: '#111' },
        areaStyle: { color: 'rgba(17,17,17,.045)' },
        emphasis: { scale: false, itemStyle: { color: '#111' } }
      }]
    }, true)
  }, [points, range])

  return (
    <section className="chart-view">
      <div className="chart-head">
        <div className="mode-switch">
          <div className="mode-switch-inner">
            {Object.entries(MODE_ICONS).map(([value, icon]) => (
              <button key={value} className={mode === value ? 'active' : ''} onClick={() => onMode(value)}><Icon name={icon} filled={mode === value} /></button>
            ))}
          </div>
        </div>
        <output className="hero-balance">{formatMoney(current)}</output>
      </div>
      <div className="chart-stage">
        <div className="plot-stage">
          <div ref={element} className="chart" />
          {!points.length && <button className="empty-chart" onClick={onEmpty}><Icon name="add_chart" /></button>}
        </div>
        <TimelineRail dates={points.map(point => point.value[0])} range={range} onRange={setRange} />
      </div>
    </section>
  )
}
