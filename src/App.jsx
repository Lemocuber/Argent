import { lazy, Suspense, useEffect, useState } from 'react'
import { api } from './api.js'
import { ChannelSheet } from './components/ChannelSheet.jsx'
import { EmojiGate } from './components/EmojiGate.jsx'
import { EntrySheet } from './components/EntrySheet.jsx'
import { Icon } from './components/Icon.jsx'
import { ReportView } from './components/ReportView.jsx'
import { today } from './lib.js'

const BalanceChart = lazy(() => import('./components/BalanceChart.jsx').then(module => ({ default: module.BalanceChart })))
const Frame = ({ children }) => <div className="device-frame"><div className="device-content">{children}</div></div>

const storedAccount = localStorage.getItem('argent.account')

export default function App() {
  const [account, setAccount] = useState(storedAccount)
  const [state, setState] = useState({ channels: [], entries: [] })
  const [view, setView] = useState('chart')
  const [mode, setMode] = useState('net')
  const [date, setDate] = useState(today())
  const [channelSheet, setChannelSheet] = useState(undefined)
  const [entryChannel, setEntryChannel] = useState(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

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

  if (!account) return <Frame><EmojiGate onEnter={enter} /></Frame>
  if (!ready) return <Frame><div className="boot"><i /></div></Frame>
  if (failed) return <Frame><button className="fatal" onClick={() => location.reload()}><Icon name="sync_problem" /></button></Frame>

  return (
    <Frame>
      <main className="app-shell">
        {view === 'chart'
          ? <Suspense fallback={<div className="chart-pending"><i /></div>}><BalanceChart {...state} mode={mode} onMode={setMode} onEmpty={() => setView('report')} /></Suspense>
          : <ReportView {...state} date={date} onDate={setDate} onAdd={() => setChannelSheet(null)} onEditChannel={setChannelSheet} onEntry={setEntryChannel} />}

        <nav className="app-nav">
          <button className={view === 'chart' ? 'active' : ''} onClick={() => setView('chart')}><Icon name="monitoring" filled={view === 'chart'} /></button>
          <button className={view === 'report' ? 'active' : ''} onClick={() => setView('report')}><Icon name="edit_note" filled={view === 'report'} /></button>
        </nav>

        {channelSheet !== undefined && (
          <ChannelSheet channel={channelSheet} onClose={() => setChannelSheet(undefined)} onSave={value => mutate(() => channelSheet
            ? api.updateChannel(account, channelSheet.id, value)
            : api.createChannel(account, value)).then(() => setChannelSheet(undefined))}
            onDelete={() => mutate(() => api.deleteChannel(account, channelSheet.id)).then(() => setChannelSheet(undefined))} />
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
