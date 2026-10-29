import React, { useEffect, useState } from 'react'
import { SKILLS, skill, diagnoseSub, FIXES, LADDER, makeSub } from './skills.js'
import { load, save, record, today, mastery, PETS, petStage, nextAt, fresh } from './store.js'
import { say, setAudio } from './speech.js'
import { NumPad, Clock, Vertical, BlocksPic, Speak, useSayOnce, useTimer } from './ui.jsx'
import Ladder from './Ladder.jsx'

const STOPS = [
  { id: 'sprint', icon: '⚡', name: 'Fast facts' },
  { id: 'warmup', icon: '🧱', name: 'Warm up' },
  { id: 'learn', icon: '💡', name: 'Learn' },
  { id: 'practice', icon: '🎯', name: 'Practice' },
  { id: 'review', icon: '🔁', name: 'Review' },
]

export default function App() {
  const [s, setS] = useState(null), [screen, setScreen] = useState('home')
  useEffect(() => { load().then(x => { setAudio(x.audio); setS(x) }) }, [])
  if (!s) return <div className="center">…</div>
  const update = (fn) => { const n = structuredClone(s); fn(n); setS(n); save(n) }
  const day = s.days[today()] || {}, done = day.done || []
  const finishStop = (id, xp = 5) => update(n => { const d = n.days[today()] || { right: 0, wrong: 0 }; d.done = [...new Set([...(d.done || []), id])]; n.days[today()] = d; n.xp += xp
    if (d.done.length === STOPS.length && n.lastDay !== today()) { const y = new Date(); y.setDate(y.getDate() - 1); n.streak = n.lastDay === y.toLocaleDateString('en-CA') ? n.streak + 1 : 1; n.lastDay = today() } })
  const back = () => setScreen('path')
  const common = { s, update, back }
  switch (screen) {
    case 'path': return <Path done={done} go={setScreen} home={() => setScreen('home')} />
    case 'sprint': return <Sprint {...common} finish={() => { finishStop('sprint'); back() }} />
    case 'warmup': return <Quiz {...common} title="Warm up" items={warmItems()} finish={(wrong) => { if (wrong >= 2 && s.ladderStep > 0) update(n => { n.ladderStep-- }); finishStop('warmup'); back() }} />
    case 'learn': return <Learn {...common} finish={() => { finishStop('learn'); back() }} />
    case 'practice': return <Quiz {...common} title="Practice" adaptive items={null} count={8} finish={() => { finishStop('practice'); back() }} />
    case 'review': return <Quiz {...common} title="Review" items={reviewItems(s)} finish={() => { finishStop('review', 10); setScreen(done.length >= 4 ? 'reward' : 'path') }} />
    case 'reward': return <Reward s={s} home={() => setScreen('home')} />
    case 'pet': return <PetRoom s={s} home={() => setScreen('home')} />
    case 'parent': return <Parent {...common} home={() => setScreen('home')} />
    default: return <Home s={s} done={done} go={setScreen} />
  }
}

function warmItems() { return [skill('trade').make(), skill('pv').make(), skill('trade').make()].map(it => ({ ...it, sid: it.text.includes('tens') && it.text.includes('=') ? 'trade' : 'pv' })) }
function reviewItems(s) {
  const pool = SKILLS.filter(k => k.roles.includes('review'))
  const due = pool.filter(k => !s.skills[k.id] || s.skills[k.id].due <= today()).sort((a, b) => (s.skills[a.id]?.due || '') < (s.skills[b.id]?.due || '') ? -1 : 1)
  const ids = due.map(k => k.id).slice(0, 5)
  if (!ids.includes('clock')) ids[Math.min(ids.length, 4)] = 'clock'
  while (ids.length < 5) ids.push(pool[Math.floor(Math.random() * pool.length)].id)
  return ids.map(id => ({ ...skill(id).make(id === 'sub3' ? Math.max(0, s.ladderStep - 1) : undefined), sid: id }))
}

function Home({ s, done, go }) {
  const st = petStage(s.xp)
  useSayOnce(done.length >= STOPS.length ? 'All done today! Great job, Sean!' : 'Hi Sean! Tap start.', 'home')
  return <div className="screen home">
    <button className="gear" onClick={() => go('parent')}>⚙️</button>
    <div className="pet big-pet" onClick={() => go('pet')}>{PETS[st]}</div>
    <div className="row-info"><span>🔥 {s.streak}</span><span>⭐ {s.xp}</span></div>
    <button className="big start" onClick={() => { say('Let us go!'); go('path') }}>{done.length >= STOPS.length ? 'Play again ▶' : 'Start ▶'}</button>
  </div>
}

function Path({ done, go, home }) {
  const next = STOPS.find(x => !done.includes(x.id))
  useSayOnce(next ? `Tap ${next.name}.` : 'All done!', 'path' + done.length)
  return <div className="screen path">
    <button className="homeb" onClick={home}>🏠</button>
    <div className="stops">{STOPS.map((x, i) => {
      const isDone = done.includes(x.id), open = isDone || x === next
      return <button key={x.id} className={`stop ${isDone ? 'done' : ''} ${x === next ? 'next' : ''}`} disabled={!open} onClick={() => { say(x.name); go(x.id) }}>
        <span className="ic">{isDone ? '✅' : open ? x.icon : '🔒'}</span><span>{x.name}</span></button>
    })}</div>
  </div>
}

function Sprint({ s, update, back, finish }) {
  const [running, setRunning] = useState(false), [it, setIt] = useState(() => skill('facts').make()), [v, setV] = useState(''), [score, setScore] = useState(0), [over, setOver] = useState(false), [bad, setBad] = useState(false)
  const left = useTimer(120, running, () => { setRunning(false); setOver(true) })
  useSayOnce(over ? `Time! You got ${score}.` : running ? it.say : 'Fast facts! Two minutes. Tap go.', over ? 'over' : running ? it.text : 'intro')
  useEffect(() => { if (over) update(n => { n.sprintBest = Math.max(n.sprintBest, score); n.days[today()] = { ...(n.days[today()] || { right: 0, wrong: 0 }), sprint: score } }) }, [over])
  const go = (val) => {
    setV(''); const ok = Number(val) === it.answer
    update(n => record(n, 'facts', ok))
    if (ok) { setScore(score + 1); setBad(false); setIt(skill('facts').make()) } else { setBad(true); say('Try again') }
  }
  if (!running && !over) return <div className="screen center"><button className="homeb" onClick={back}>⬅</button><h1>⚡ Fast facts</h1><p className="big-t">2 min</p><button className="big" onClick={() => setRunning(true)}>Go!</button></div>
  if (over) return <div className="screen center"><h1>⏰ Time!</h1><p className="big-t">⭐ {score}</p><p>Best: {Math.max(s.sprintBest, score)}</p><button className="big" onClick={finish}>Next ➜</button></div>
  return <div className="screen qa">
    <div className="topbar"><span>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span><span>⭐ {score}</span></div>
    <div className="qrow"><div className={`qtext huge ${bad ? 'shake' : ''}`}>{it.text}<Speak text={it.say} /></div><NumPad value={v} setValue={setV} onGo={go} max={2} /></div>
  </div>
}

function Learn({ s, back, finish }) {
  const [p] = useState(() => makeSub(s.ladderStep)), st = LADDER[s.ladderStep]
  return <div className="screen"><button className="homeb" onClick={back}>⬅</button>
    <div className="title">💡 {st.name}</div>
    <Ladder a={p.a} b={p.b} intro={st.say} onDone={finish} /></div>
}

// Generic item runner. adaptive=true => 3-digit subtraction with step changes + mistake diagnosis + fix-it lessons.
function Quiz({ s, update, back, title, items: items0, count, adaptive, finish }) {
  const [items] = useState(items0)
  const total = items ? items.length : count
  const [i, setI] = useState(0), [step, setStep] = useState(s.ladderStep), [runR, setRunR] = useState(0), [runW, setRunW] = useState(0)
  const [it, setIt] = useState(() => items ? items[0] : { ...skill('sub3').make(s.ladderStep), sid: 'sub3' })
  const [v, setV] = useState(''), [tries, setTries] = useState(0), [fix, setFix] = useState(null), [wrongs, setWrongs] = useState(0), [good, setGood] = useState(false)
  useSayOnce(fix ? FIXES[fix.m].say : good ? 'Yes!' : it.say, fix ? 'fix' + i : good ? 'good' + i : it.text + i)
  const next = (ns = step) => {
    setGood(false); setTries(0); setV('')
    if (i + 1 >= total) return finish(wrongs)
    setI(i + 1); setIt(items ? items[i + 1] : { ...skill('sub3').make(ns), sid: 'sub3' })
  }
  const answer = (val) => {
    const ok = String(val) === String(it.answer)
    let m = null
    if (!ok && (it.sid === 'sub3')) m = diagnoseSub(it.a, it.b, Number(val))
    if (tries === 0) update(n => { record(n, it.sid, ok, m ? { mistake: m, a: it.a, b: it.b, got: Number(val) } : {}); if (ok) n.xp += 1 })
    if (ok) {
      setGood(true); let ns = step
      if (adaptive) { const rr = runR + 1; setRunW(0); if (rr >= 3 && step < 4) { ns = step + 1; setStep(ns); setRunR(0); update(n => { n.ladderStep = ns }) } else setRunR(rr) }
      setTimeout(() => next(ns), 900); return
    }
    if (tries === 0) setWrongs(wrongs + 1)
    if (m) { setFix({ m }); if (adaptive) { const ww = runW + 1; setRunR(0); if (ww >= 2 && step > 0) { setStep(step - 1); setRunW(0); update(n => { n.ladderStep = step - 1 }) } else setRunW(ww) } return }
    if (tries === 0) { setTries(1); setV(''); say('Try again.'); return }
    say(`It is ${it.sayChoice ? it.sayChoice(it.answer) : it.answer}.`); setGood('show'); setTimeout(() => next(), 2500)
  }
  if (fix) return <div className="screen"><button className="homeb" onClick={back}>⬅</button>
    <div className="title">🛠 {FIXES[fix.m].title} <Speak text={FIXES[fix.m].say} /></div>
    <Ladder a={it.a} b={it.b} onDone={() => { setFix(null); next() }} /></div>
  return <div className="screen qa">
    <button className="homeb" onClick={back}>⬅</button>
    <div className="topbar"><span>{title}</span><span>{Array.from({ length: total }, (_, k) => k < i ? '🟢' : k === i ? '🔵' : '⚪').join('')}</span></div>
    <div className="qrow">
      <div className="qleft">
        {it.view?.clock && <Clock h={it.view.clock[0]} m={it.view.clock[1]} size={230} />}
        {it.view?.blocks && <BlocksPic n={it.view.blocks} />}
        {it.vertical ? <Vertical a={it.a} b={it.b} op={it.op || '−'} ans={good === 'show' ? it.answer : ''} /> : <div className="qtext">{it.text.split('\n').map((l, k) => <div key={k}>{l}</div>)}</div>}
        <Speak text={it.say} />
        {good === true && <div className="yay">✅ Yes!</div>}
        {good === 'show' && !it.vertical && <div className="yay">👉 {it.answer}</div>}
      </div>
      {it.kind === 'choice'
        ? <div className="choices">{it.choices.map(c => <button key={c} onClick={() => { if (it.sayChoice) say(it.sayChoice(c)); answer(c) }}>{c}</button>)}</div>
        : <NumPad value={v} setValue={setV} onGo={answer} max={4} />}
    </div>
  </div>
}

function Reward({ s, home }) {
  const st = petStage(s.xp)
  useSayOnce(`All done! Your pet is growing. Great work, Sean!`, 'rw')
  return <div className="screen center"><div className="pet big-pet bounce">{PETS[st]}</div><h1>🎉 All done!</h1><p>⭐ {s.xp}</p><button className="big" onClick={home}>Home 🏠</button></div>
}
function PetRoom({ s, home }) {
  const st = petStage(s.xp), need = nextAt(st)
  useSayOnce(st >= PETS.length - 1 ? 'Your pet is all grown up!' : `${need - s.xp} more stars to grow!`, 'pet')
  return <div className="screen center"><button className="homeb" onClick={home}>🏠</button>
    <div className="pets">{PETS.map((p, i) => <span key={i} className={i <= st ? 'got' : 'lock'}>{i <= st ? p : '❔'}</span>)}</div>
    <div className="pet big-pet">{PETS[st]}</div>
    {st < PETS.length - 1 && <><div className="bar"><div style={{ width: `${Math.min(100, 100 * s.xp / need)}%` }} /></div><p>⭐ {s.xp} / {need}</p></>}
  </div>
}

function Parent({ s, update, home }) {
  const [ok, setOk] = useState(false), [v, setV] = useState(''), [np, setNp] = useState('')
  if (!ok) return <div className="screen center"><button className="homeb" onClick={home}>🏠</button><h2>Grown-ups only 🔒</h2>
    <NumPad value={v.replace(/./g, '•')} setValue={(x) => setV(x.length < v.length ? v.slice(0, -1) : v + x.slice(-1))} onGo={() => { if (v === s.pin) setOk(true); else setV('') }} max={6} /></div>
  const days = Object.entries(s.days).sort().slice(-7)
  const recent = s.log.filter(l => l.mistake).slice(-8).reverse()
  return <div className="screen parent"><button className="homeb" onClick={home}>🏠</button>
    <h2>Parent dashboard</h2>
    <div className="pgrid">
      <section><h3>Skills (NY Grade 2)</h3><table><thead><tr><th>Skill</th><th>Std</th><th>Mastery</th><th>✔/✘</th><th>Next review</th></tr></thead><tbody>
        {SKILLS.map(k => { const x = s.skills[k.id]; return <tr key={k.id}><td>{k.name}</td><td>{k.std}</td><td><div className="mbar"><div style={{ width: mastery(x) + '%' }} /></div>{mastery(x)}%</td><td>{x ? `${x.right}/${x.wrong}` : '–'}</td><td>{x?.due || '–'}</td></tr> })}
      </tbody></table></section>
      <section><h3>Subtraction mistakes</h3>{Object.keys(FIXES).map(m => <div key={m}>{FIXES[m].title}: <b>{s.mistakes[m] || 0}</b></div>)}
        <h4>Recent</h4>{recent.length ? recent.map((l, k) => <div key={k} className="small">{l.a} − {l.b}: wrote {l.got} ({FIXES[l.mistake].title})</div>) : <div className="small">None yet</div>}</section>
      <section><h3>Last 7 days</h3>{days.length ? days.map(([d, x]) => <div key={d}>{d}: ✔{x.right || 0} ✘{x.wrong || 0} {x.sprint != null ? `⚡${x.sprint}` : ''} {(x.done || []).length}/5 stops</div>) : 'No data yet'}
        <p>Sprint best: <b>{s.sprintBest}</b> · Streak: <b>{s.streak}</b> · Stars: <b>{s.xp}</b></p></section>
      <section><h3>Settings</h3>
        <label>Subtraction level: <select value={s.ladderStep} onChange={e => update(n => { n.ladderStep = Number(e.target.value) })}>{LADDER.map((l, k) => <option key={k} value={k}>{k}. {l.name}</option>)}</select></label>
        <label><input type="checkbox" checked={s.audio} onChange={e => { setAudio(e.target.checked); update(n => { n.audio = e.target.checked }) }} /> Read aloud</label>
        <label>New PIN: <input inputMode="numeric" value={np} onChange={e => setNp(e.target.value.replace(/\D/g, '').slice(0, 6))} /> <button disabled={np.length < 4} onClick={() => { update(n => { n.pin = np }); setNp(''); alert('PIN saved') }}>Save</button></label>
        <button onClick={() => update(n => { n.days[today()] = { ...(n.days[today()] || {}), done: [] } })}>Reopen today's path</button>
        <button className="danger" onClick={() => { if (confirm('Erase all progress?')) update(n => Object.assign(n, fresh(), { pin: n.pin })) }}>Reset progress</button>
      </section>
    </div></div>
}
