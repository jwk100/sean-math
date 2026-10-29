// Data-driven skill registry. To add a unit (money, measurement...), add an object here.
// Each skill: id, name, standard (NY 2nd grade), role(s), make(level) -> item.
// item: { text (short on-screen), say (read aloud), kind: 'num'|'choice', answer, choices?, view? }
export const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1])
const digits = (n) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)] // ones, tens, hundreds

// ---------- 3-digit subtraction ladder ----------
export const LADDER = [
  { name: 'No trade', say: 'No trading today.' },
  { name: 'Trade a ten', say: 'Break a ten.' },
  { name: 'Trade a hundred', say: 'Break a hundred.' },
  { name: 'Trade two times', say: 'Break two times.' },
  { name: 'Zero in the middle', say: 'Zero in the middle.' },
]
export function makeSub(step) {
  for (let i = 0; i < 500; i++) {
    let a, b
    if (step === 4) { a = r(2, 9) * 100 + (Math.random() < .5 ? 0 : r(1, 9)); b = r(1, Math.floor(a / 100) - 1) * 100 + r(1, 9) * 10 + r(1, 9); if (a % 10 === 0) { /* 400-163 style */ } }
    else { a = r(200, 999); b = r(100, a - 1) }
    const [ao, at] = digits(a), [bo, bt] = digits(b)
    const needO = ao < bo, aT2 = needO ? at - 1 : at, needT = aT2 < bt
    const zeroMid = at === 0 && needO
    const ok = step === 0 ? (!needO && !needT) : step === 1 ? (needO && !needT && at > 0) : step === 2 ? (!needO && needT) : step === 3 ? (needO && needT && at > 0) : (zeroMid)
    if (ok && a - b > 0) return { a, b }
  }
  return { a: 403, b: 167 }
}
// Mistake patterns for a - b. Returns pattern id or null.
export function diagnoseSub(a, b, ans) {
  if (ans === a - b) return null
  const A = digits(a), B = digits(b)
  const smallFromBig = A.map((d, i) => Math.abs(d - B[i]))
  if (ans === smallFromBig[0] + smallFromBig[1] * 10 + smallFromBig[2] * 100) return 'flip'
  // borrowed but did not take 1 away from the next column
  let noReduce = 0, carry = 0
  for (let i = 0; i < 3; i++) { let d = A[i]; if (d < B[i]) { d += 10 } noReduce += (d - B[i]) * 10 ** i }
  if (ans === noReduce) return 'forgot'
  if (A[1] === 0 && A[0] < B[0]) {
    // zero trouble: treated zero oddly (e.g., 0 -> 9 but hundreds not reduced, or skipped)
    const z1 = (A[0] + 10 - B[0]) + (9 - B[1]) * 10 + (A[2] - B[2]) * 100
    const z2 = (A[0] + 10 - B[0]) + (10 - B[1]) * 10 + (A[2] - 1 - B[2]) * 100
    if (ans === z1 || ans === z2) return 'zero'
  }
  const diff = Math.abs(ans - (a - b))
  if ([1, 2, 10, 20, 100].includes(diff)) return 'slip'
  return 'other'
}
export const FIXES = {
  flip: { title: 'Top minus bottom', say: 'Always start with the top number. If the top is too small, break a ten. Do not flip it.' },
  forgot: { title: 'Cross it out', say: 'When you break a ten, the tens go down by one. Cross it out.' },
  zero: { title: 'Zero trick', say: 'No tens? Break a hundred first. Then break a ten.' },
  slip: { title: 'Check the fact', say: 'So close! Check each take away fact.' },
  other: { title: 'Use the blocks', say: 'Let us do it with blocks, one step at a time.' },
}

// ---------- clock helper ----------
const tstr = (h, m) => `${h}:${String(m).padStart(2, '0')}`
const tsay = (h, m) => m === 0 ? `${h} o'clock` : `${h} ${m < 10 ? 'oh ' + m : m}`

export const SKILLS = [
  { id: 'facts', name: 'Take away facts', std: '2.OA.B.2', roles: ['sprint'],
    make: () => { const a = r(10, 20), b = r(2, Math.min(10, a)); return { text: `${a} − ${b}`, say: `${a} take away ${b}`, kind: 'num', answer: a - b } } },
  { id: 'pv', name: 'Place value', std: '2.NBT.A.1', roles: ['warmup', 'review'],
    make: () => { const n = r(101, 989), [o, t, h] = digits(n), w = pick([['hundreds', h], ['tens', t], ['ones', o]]); return { text: `${n}\nHow many ${w[0]}?`, say: `${n}. How many ${w[0]}?`, kind: 'num', answer: w[1], view: { blocks: n } } } },
  { id: 'trade', name: 'Trade a ten', std: '2.NBT.A.1', roles: ['warmup'],
    make: () => { if (Math.random() < .5) { const t = r(1, 9), o = r(0, 9); return { text: `${t} tens ${o} ones\n= ${t - 1} tens ? ones`, say: `${t} tens and ${o} ones. Break a ten. ${t - 1} tens and how many ones?`, kind: 'num', answer: o + 10 } }
      const h = r(1, 9); return { text: `${h} hundreds 0 tens\n= ${h - 1} hundreds ? tens`, say: `${h} hundreds and zero tens. Break a hundred. ${h - 1} hundreds and how many tens?`, kind: 'num', answer: 10 } } },
  { id: 'sub3', name: '3-digit take away', std: '2.NBT.B.7', roles: ['practice', 'review'], ladder: true,
    make: (step = 1) => { const { a, b } = makeSub(step); return { text: `${a} − ${b}`, say: `${a} take away ${b}`, kind: 'num', answer: a - b, a, b, vertical: true } } },
  { id: 'add2', name: '2-digit adding', std: '2.NBT.B.5', roles: ['review'],
    make: () => { const a = r(12, 79), b = r(11, 99 - a); return { text: `${a} + ${b}`, say: `${a} plus ${b}`, kind: 'num', answer: a + b, vertical: true, a, b, op: '+' } } },
  { id: 'skip', name: 'Skip count', std: '2.NBT.A.2', roles: ['review'],
    make: () => { const s = pick([2, 5, 10, 100]), st = s === 100 ? r(1, 5) * 100 : s * r(1, 8), seq = [0, 1, 2].map(i => st + s * i); return { text: `${seq.join(', ')}, ?`, say: `Count by ${s}s. ${seq.join(', ')}. What comes next?`, kind: 'num', answer: st + s * 3 } } },
  { id: 'compare', name: 'Compare numbers', std: '2.NBT.A.4', roles: ['review'],
    make: () => { const a = r(100, 999), b = Math.random() < .15 ? a : (Math.random() < .5 ? a + pick([1, 10, 100, -10, -1]) : r(100, 999)); const ans = a > b ? '>' : a < b ? '<' : '='; return { text: `${a}  ?  ${b}`, say: `${a} and ${b}. Pick the sign.`, kind: 'choice', choices: ['>', '<', '='], answer: ans } } },
  { id: 'clock', name: 'Tell time', std: '2.MD.C.7', roles: ['review'],
    make: () => { const h = r(1, 12), m = r(0, 11) * 5, opts = new Set([tstr(h, m)]); while (opts.size < 3) opts.add(tstr(pick([h, h % 12 + 1, r(1, 12)]), pick([m, (m + 30) % 60, r(0, 11) * 5]))); return { text: 'What time?', say: 'What time is it?', kind: 'choice', choices: shuffle([...opts]), answer: tstr(h, m), view: { clock: [h, m] }, sayChoice: (c) => { const [hh, mm] = c.split(':').map(Number); return tsay(hh, mm) } } } },
  // Example for later units:
  // { id: 'money', name: 'Coins', std: '2.MD.C.8', roles: ['review'], make: () => ({...}) },
]
export const skill = (id) => SKILLS.find(s => s.id === id)
