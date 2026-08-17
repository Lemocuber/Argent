import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { DataZoomInsideComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { displayDate, formatMoney, MODE_ICONS } from '../lib.js'
import { Icon } from './Icon.jsx'

echarts.use([LineChart, DataZoomInsideComponent, GridComponent, TooltipComponent, CanvasRenderer])

const typesFor = mode => mode === 'cash' ? ['cash'] : mode === 'total' ? ['cash', 'savings'] : ['cash', 'savings', 'accrued']
const escape = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

const pointsFor = (channels, entries, mode) => {
  const included = channels.filter(channel => !channel.archived && typesFor(mode).includes(channel.type))
  const ids = new Set(included.map(channel => channel.id))
  const dates = [...new Set(entries.filter(entry => ids.has(entry.channelId)).map(entry => entry.date))].sort()
  return dates.map((date, index) => {
    const amount = included.reduce((sum, channel) => {
      const entry = entries.filter(item => item.channelId === channel.id && item.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0]
      return sum + (entry?.amountCents || 0)
    }, 0)
    const notes = entries.filter(entry => ids.has(entry.channelId) && entry.date === date && entry.note)
      .map(entry => `${included.find(channel => channel.id === entry.channelId)?.emoji || ''} ${entry.note}`)
    return { value: [date, amount], amount, delta: index ? amount : null, notes }
  }).map((point, index, points) => ({ ...point, delta: index ? point.amount - points[index - 1].amount : null }))
}

export function BalanceChart({ channels, entries, mode, onMode, onEmpty }) {
  const element = useRef(null)
  const chart = useRef(null)
  const points = useMemo(() => pointsFor(channels, entries, mode), [channels, entries, mode])
  const current = points.at(-1)?.amount || 0

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
      grid: { left: 10, right: 10, top: 22, bottom: 26, containLabel: true },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        minInterval: 24 * 60 * 60 * 1000,
        axisLine: { lineStyle: { color: '#111', width: 1 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#111', fontFamily: 'Azeret Mono Variable', fontSize: 9, formatter: value => displayDate(new Date(value).toISOString().slice(0, 10)) }
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#d6d4ce', width: 1 } },
        axisLabel: { color: '#111', fontFamily: 'Azeret Mono Variable', fontSize: 10, formatter: value => formatMoney(Math.round(value)) }
      },
      dataZoom: [{ type: 'inside', filterMode: 'none', zoomOnMouseWheel: true, moveOnMouseWheel: false, moveOnMouseMove: true }],
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: '#f7f6f1',
        borderColor: '#111',
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: '#111', fontFamily: 'Azeret Mono Variable', fontSize: 12 },
        extraCssText: 'box-shadow:none;border-radius:0;max-width:280px',
        formatter: params => {
          const point = params[0]?.data
          if (!point) return ''
          const delta = point.delta === null ? '' : `<b class="tip-delta ${point.delta > 0 ? 'up' : point.delta < 0 ? 'down' : ''}">${point.delta > 0 ? '+' : ''}${formatMoney(point.delta)}</b>`
          const notes = point.notes.map(note => `<i>${escape(note)}</i>`).join('')
          return `<span>${displayDate(point.value[0])}</span><strong>${formatMoney(point.amount)}</strong>${delta}${notes}`
        }
      },
      series: [{
        type: 'line',
        data: points,
        step: 'end',
        showSymbol: points.length < 20,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#111', width: 1.5 },
        itemStyle: { color: '#111' },
        areaStyle: { color: 'rgba(17,17,17,.045)' },
        emphasis: { scale: 1.6, itemStyle: { color: '#111' } }
      }]
    }, true)
  }, [points])

  return (
    <section className="chart-view">
      <div className="chart-head">
        <div className="mode-switch">
          {Object.entries(MODE_ICONS).map(([value, icon]) => (
            <button key={value} className={mode === value ? 'active' : ''} onClick={() => onMode(value)}><Icon name={icon} filled={mode === value} /></button>
          ))}
        </div>
        <output className="hero-balance">{formatMoney(current)}</output>
      </div>
      <div className="chart-stage">
        <div ref={element} className="chart" />
        {!points.length && <button className="empty-chart" onClick={onEmpty}><Icon name="add_chart" /></button>}
      </div>
    </section>
  )
}
