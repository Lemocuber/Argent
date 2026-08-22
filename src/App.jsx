import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { ChannelSheet } from './components/ChannelSheet.jsx'
import { EmojiGate } from './components/EmojiGate.jsx'
import { EntrySheet } from './components/EntrySheet.jsx'
import { Icon } from './components/Icon.jsx'
import { ReportView } from './components/ReportView.jsx'
import { clearChannelOrder } from './channelOrder.js'
import { clearGraphMode, loadGraphMode, saveGraphMode } from './graphMode.js'
import { today } from './lib.js'

const BalanceChart = lazy(() => import('./components/BalanceChart.jsx').then(module => ({ default: module.BalanceChart })))
const Frame = ({ children }) => <div className="device-frame"><div className="device-content">{children}</div></div>

const storedAccount = localStorage.getItem('argent.account')

export default function App() {
  const [account, setAccount] = useState(storedAccount)
  const [state, setState] = useState({ channels: [], entries: [] })
  const [view, setView] = useState('chart')
  const [mode, setMode] = useState(loadGraphMode)
  const [date, setDate] = useState(today())
  const [channelSheet, setChannelSheet] = useState(undefined)
  const [entryChannel, setEntryChannel] = useState(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const navTaps = useRef({ view: null, started: 0, count: 0 })

  const load = async id => setState(await api.state(id))
  const enter = async id => {
    await api.enter(id)
    localStorage.setItem('argent.account', id)
    setAccount(id)
    await load(id)
    setReady(true)
  }

  useEffect(() => {
    if (!account) return
    enter(account).catch(() => { setFailed(true); setReady(true) })
  }, [])

  const mutate = async action => {
    await action()
    await load(account)
  }
  const navigate = next => {
    const now = performance.now()
    const taps = navTaps.current
    if (taps.view !== next || now - taps.started > 3000) Object.assign(taps, { view: next, started: now, count: 1 })
    else taps.count += 1
    if (taps.count >= 10) {
      localStorage.removeItem('argent.account')
      clearChannelOrder()
      clearGraphMode()
      location.reload()
      return
    }
    setView(next)
  }

  if (!account) return <Frame><EmojiGate onEnter={enter} /></Frame>
  if (!ready) return <Frame><div className="boot"><i /></div></Frame>
  if (failed) return <Frame><button className="fatal" onClick={() => location.reload()}><Icon name="sync_problem" /></button></Frame>

  return (
    <Frame>
      <main className="app-shell">
        {view === 'chart'
          ? <Suspense fallback={<div className="chart-pending"><i /></div>}><BalanceChart {...state} mode={mode} onMode={next => setMode(saveGraphMode(next))} onEmpty={() => setView('report')} /></Suspense>
          : <ReportView {...state} account={account} date={date} onDate={setDate} onAdd={() => setChannelSheet(null)} onEditChannel={setChannelSheet} onEntry={setEntryChannel} />}

        <nav className="app-nav">
          <button className={view === 'chart' ? 'active' : ''} onClick={() => navigate('chart')}><Icon name="monitoring" filled={view === 'chart'} /></button>
          <button className={view === 'report' ? 'active' : ''} onClick={() => navigate('report')}><Icon name="edit_note" /></button>
        </nav>

        {channelSheet !== undefined && (
          <ChannelSheet channel={channelSheet} date={date} onClose={() => setChannelSheet(undefined)} onSave={value => mutate(() => channelSheet
            ? api.updateChannel(account, channelSheet.id, value)
            : api.createChannel(account, value)).then(() => setChannelSheet(undefined))}
            onDelete={() => mutate(() => api.deleteChannel(account, channelSheet.id)).then(() => setChannelSheet(undefined))}
            onCloseAt={value => mutate(() => api.closeChannel(account, channelSheet.id, value)).then(() => setChannelSheet(undefined))} />
        )}
        {entryChannel && (
          <EntrySheet channel={entryChannel} date={date} entries={state.entries} onClose={() => setEntryChannel(null)}
            onSave={value => mutate(() => api.saveEntry(account, value)).then(() => setEntryChannel(null))}
            onDelete={entryId => mutate(() => api.deleteEntry(account, entryId)).then(() => setEntryChannel(null))} />
        )}
      </main>
    </Frame>
  )
}
