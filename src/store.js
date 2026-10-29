import { get, set } from 'idb-keyval'
export const INTERVALS = [1, 2, 4, 7] // days
export const today = () => new Date().toLocaleDateString('en-CA')
export const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA') }
export const fresh = () => ({ v: 1, pin: '2468', audio: true, xp: 0, streak: 0, lastDay: null, ladderStep: 1, sprintBest: 0,
  skills: {}, mistakes: {}, days: {}, log: [] })
export async function load() { const s = await get('sean-math'); return s ? { ...fresh(), ...s } : fresh() }
export async function save(s) { await set('sean-math', s) }
export function record(s, id, ok, extra = {}) {
  const k = s.skills[id] || { box: 0, due: today(), right: 0, wrong: 0 }
  if (ok) { k.right++; k.box = Math.min(k.box + 1, INTERVALS.length) } else { k.wrong++; k.box = 0 }
  k.due = addDays(today(), INTERVALS[Math.max(0, k.box - 1)])
  s.skills[id] = k
  const d = s.days[today()] || { right: 0, wrong: 0, secs: 0 }
  ok ? d.right++ : d.wrong++; s.days[today()] = d
  if (extra.mistake) s.mistakes[extra.mistake] = (s.mistakes[extra.mistake] || 0) + 1
  s.log.push({ t: Date.now(), id, ok, ...extra }); if (s.log.length > 2000) s.log.splice(0, 500)
}
export const mastery = (k) => !k ? 0 : Math.round(100 * (k.right / Math.max(1, k.right + k.wrong)) * Math.min(1, (k.right + k.wrong) / 10))
export const PETS = ['🥚', '🐣', '🐥', '🐤', '🐔', '🦚', '🐉']
export const petStage = (xp) => Math.min(PETS.length - 1, Math.floor(Math.sqrt(xp / 15)))
export const nextAt = (st) => 15 * (st + 1) ** 2
