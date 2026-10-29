import React, { useEffect, useRef, useState } from 'react'
import { say } from './speech.js'

export function Speak({ text }) { return <button className="spk" aria-label="Hear it" onClick={() => say(text)}>🔊</button> }

export function NumPad({ value, setValue, onGo, max = 4 }) {
  const press = (k) => { if (k === '⌫') setValue(value.slice(0, -1)); else if (value.length < max) setValue(value + k) }
  return <div className="pad">
    <div className="padshow">{value || ' '}</div>
    <div className="keys">{['1','2','3','4','5','6','7','8','9','⌫','0'].map(k => <button key={k} onClick={() => press(k)}>{k}</button>)}
      <button className="go" disabled={!value} onClick={() => onGo(value)}>✔</button></div>
  </div>
}

export function Clock({ h, m, size = 200 }) {
  const c = size / 2, ha = ((h % 12) + m / 60) * 30, ma = m * 6
  const hand = (ang, len, w, col) => { const a = (ang - 90) * Math.PI / 180; return <line x1={c} y1={c} x2={c + Math.cos(a) * len} y2={c + Math.sin(a) * len} stroke={col} strokeWidth={w} strokeLinecap="round" /> }
  return <svg width={size} height={size} className="clock">
    <circle cx={c} cy={c} r={c - 4} fill="#fff" stroke="#333" strokeWidth="4" />
    {Array.from({ length: 12 }, (_, i) => { const a = ((i + 1) * 30 - 90) * Math.PI / 180; return <text key={i} x={c + Math.cos(a) * (c - 24)} y={c + Math.sin(a) * (c - 24) + 7} textAnchor="middle" fontSize={size / 10} fontWeight="bold">{i + 1}</text> })}
    {hand(ha, c * .45, 8, '#d33')}{hand(ma, c * .72, 5, '#2b7de9')}<circle cx={c} cy={c} r="6" />
  </svg>
}

export function Vertical({ a, b, op = '−', ans = '' }) {
  const w = 3, pad = (n) => String(n).padStart(w, ' ').split('')
  const A = pad(a), B = pad(b), C = String(ans).padStart(w, ' ').split('')
  return <div className="vert">
    <div className="hdr"><span>H</span><span>T</span><span>O</span></div>
    <div className="row"><span className="op"></span>{A.map((d, i) => <span key={i} className="cell">{d}</span>)}</div>
    <div className="row line"><span className="op">{op}</span>{B.map((d, i) => <span key={i} className="cell">{d}</span>)}</div>
    <div className="row"><span className="op"></span>{C.map((d, i) => <span key={i} className="cell ans">{d.trim()}</span>)}</div>
  </div>
}

// static blocks picture for a number
export function BlocksPic({ n }) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10
  return <div className="bpic">{Array.from({ length: h }, (_, i) => <div key={'h' + i} className="blk hun sm" />)}
    {Array.from({ length: t }, (_, i) => <div key={'t' + i} className="blk ten sm" />)}
    <div className="ones-grid">{Array.from({ length: o }, (_, i) => <div key={'o' + i} className="blk one sm" />)}</div></div>
}

export function useSayOnce(text, dep) { useEffect(() => { const id = setTimeout(() => say(text), 250); return () => clearTimeout(id) }, [dep]) }

export function Stars({ n }) { return <span className="stars">{'⭐'.repeat(n)}</span> }

export function useTimer(secs, running, onEnd) {
  const [left, setLeft] = useState(secs), end = useRef(onEnd); end.current = onEnd
  useEffect(() => { if (!running) return; const id = setInterval(() => setLeft(l => { if (l <= 1) { clearInterval(id); setTimeout(() => end.current(), 0); return 0 } return l - 1 }), 1000); return () => clearInterval(id) }, [running])
  return left
}
