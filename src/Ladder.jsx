import React, { useRef, useState } from 'react'
import { say } from './speech.js'
import { NumPad, Vertical, Speak, useSayOnce } from './ui.jsx'

const UNIT = ['ones', 'tens', 'hundreds'], ONE = ['one', 'ten', 'hundred']
const dg = (n) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)]

// Guided small-step 3-digit subtraction with draggable base-ten blocks + tap-to-break.
export default function Ladder({ a, b, onDone, intro }) {
  const B = dg(b)
  const [blocks, setBlocks] = useState(dg(a))
  const [taken, setTaken] = useState([0, 0, 0])
  const [col, setCol] = useState(0)
  const [phase, setPhase] = useState('ask')
  const [ans, setAns] = useState([null, null, null])
  const [val, setVal] = useState('')
  const [flash, setFlash] = useState(null)
  const drag = useRef(null)
  const cur = blocks[col], need = B[col]
  const ansStr = ans.slice().reverse().map(d => d === null ? ' ' : d).join('').replace(/^0+(?=\d)/, '')

  let text, speech
  if (phase === 'ask') { text = `${cur} ${UNIT[col]}. Take ${need}. Enough?`; speech = `${intro && col === 0 ? intro + ' ' : ''}Look at the ${UNIT[col]}. You have ${cur}. Take away ${need}. Do you have enough?` }
  else if (phase === 'break') { const src = blocks[col + 1] > 0 ? col + 1 : col + 2; text = src === col + 1 ? `Break a ${ONE[col + 1]}!` : `No tens! Break a hundred.`; speech = src === col + 1 ? `Not enough. Tap or drag a ${ONE[col + 1]} to break it into ten ${UNIT[col]}.` : `Not enough, and there are no tens. Break a hundred first.` }
  else if (phase === 'take') { text = `${cur} − ${need} = ?`; speech = `${cur} take away ${need}. How many ${UNIT[col]} are left?` }
  else { text = `${a} − ${b} = ${a - b}`; speech = `You did it! ${a} take away ${b} is ${a - b}.` }
  useSayOnce(speech, phase + col + blocks.join())

  const breakFrom = (src) => {
    if (phase !== 'break' || blocks[src] <= 0) return
    const ok = src === col + 1 || (src === col + 2 && blocks[col + 1] === 0)
    if (!ok) { say(`Break a ${ONE[col + 1]}.`); return }
    const nb = [...blocks]; nb[src]--; nb[src - 1] += 10; setBlocks(nb); setFlash(src - 1); setTimeout(() => setFlash(null), 600)
    if (nb[col] >= need) setPhase('take')
  }
  const answerAsk = (yes) => {
    const right = (cur >= need) === yes
    if (!right) { say(`Look again. Count the ${UNIT[col]}.`); return }
    setPhase(yes ? 'take' : 'break')
  }
  const answerTake = (v) => {
    setVal('')
    if (Number(v) !== cur - need) { say(`Try again. Count what is left.`); return }
    const na = [...ans]; na[col] = cur - need; setAns(na)
    const nb = [...blocks]; nb[col] = cur - need; setBlocks(nb)
    const nt = [...taken]; nt[col] = need; setTaken(nt)
    if (col === 2) setPhase('done'); else { setCol(col + 1); setPhase('ask') }
  }
  const down = (e, src) => { drag.current = { src, x: e.clientX, y: e.clientY, el: e.currentTarget }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const move = (e) => { const d = drag.current; if (!d) return; d.el.style.transform = `translate(${e.clientX - d.x}px,${e.clientY - d.y}px)`; d.el.style.zIndex = 9 }
  const up = (e) => {
    const d = drag.current; if (!d) return; drag.current = null; d.el.style.transform = ''; d.el.style.zIndex = ''
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y)
    if (moved < 12) return breakFrom(d.src)
    d.el.style.visibility = 'hidden'; const t = document.elementFromPoint(e.clientX, e.clientY); d.el.style.visibility = ''
    const target = t?.closest('[data-col]'); if (target && Number(target.dataset.col) === d.src - 1) breakFrom(d.src)
  }
  const colView = (c) => {
    const kind = ['one', 'ten', 'hun'][c], n = blocks[c]
    return <div key={c} data-col={c} className={`bcol ${c === col && phase !== 'done' ? 'active' : ''} ${flash === c ? 'flash' : ''}`}>
      <div className="bhead">{UNIT[c]} <b>{n}</b></div>
      <div className={`bitems ${kind}s`}>
        {Array.from({ length: n }, (_, i) => <div key={i} className={`blk ${kind}`} onPointerDown={c > 0 ? (e) => down(e, c) : undefined} onPointerMove={move} onPointerUp={up} />)}
        {Array.from({ length: taken[c] }, (_, i) => <div key={'x' + i} className={`blk ${kind} gone`} />)}
      </div>
    </div>
  }
  return <div className="ladder">
    <div className="lrow">
      <div className="blocks">{[2, 1, 0].map(colView)}</div>
      <div className="lside">
        <Vertical a={a} b={b} ans={ansStr} />
        <div className="prompt">{text} <Speak text={speech} /></div>
        {phase === 'ask' && <div className="yn"><button className="yes" onClick={() => answerAsk(true)}>Yes 👍</button><button className="no" onClick={() => answerAsk(false)}>No 👎</button></div>}
        {phase === 'take' && <NumPad value={val} setValue={setVal} onGo={answerTake} max={2} />}
        {phase === 'break' && <div className="hint">👆 Tap it or drag it ➡</div>}
        {phase === 'done' && <button className="big" onClick={onDone}>Next ➜</button>}
      </div>
    </div>
  </div>
}
