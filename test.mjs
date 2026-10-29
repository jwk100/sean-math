import { chromium } from 'playwright'
const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true }), p = await ctx.newPage()
const _c = p.click.bind(p); p.click = (s, o = {}) => _c(s, { force: true, ...o });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
const U = 'http://localhost:4173/sean-math/'
await p.goto(U); await p.waitForTimeout(800); await p.screenshot({ path: 'shots/1-home.png' })
await p.click('text=Start'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/2-path.png' })
await p.click('text=Fast facts'); await p.click('text=Go!'); await p.waitForTimeout(300)
for (let k = 0; k < 3; k++) { const t = await p.locator('.qtext.huge').innerText(); const [a, c] = t.split('−').map(x => parseInt(x)); for (const d of String(a - c)) await p.click(`.keys button:text-is("${d}")`); await p.click('.go') }
await p.screenshot({ path: 'shots/3-sprint.png' })
console.log('sprint ok')
// skip sprint timer by marking done through parent? instead navigate warmup via evaluate later
await p.evaluate(() => { window.__x = 1 })
// go to learn ladder directly: reopen via state edit
await p.goto(U); await p.waitForTimeout(500)
const { set, get } = {}
await p.evaluate(async () => { const req = indexedDB.open('keyval-store'); await new Promise(r => req.onsuccess = r); const db = req.result; const tx = db.transaction('keyval', 'readwrite'); const st = tx.objectStore('keyval'); const g = st.get('sean-math'); await new Promise(r => g.onsuccess = r); const s = g.result; const d = new Date().toLocaleDateString('en-CA'); s.days[d] = { ...(s.days[d]||{}), done: ['sprint'] }; s.ladderStep = 4; st.put(s, 'sean-math'); await new Promise(r => tx.oncomplete = r) })
await p.reload(); await p.waitForTimeout(500); await p.click('text=Start'); await p.click('text=Warm up'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/4-warm.png' })
for (let k = 0; k < 3; k++) { await p.click('.keys button:text-is("1")'); await p.click('.go'); await p.waitForTimeout(100); await p.click('.keys button:text-is("1")'); await p.click('.go'); await p.waitForTimeout(2700) }
await p.waitForTimeout(500); await p.click('text=Learn'); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/5-learn.png' })
// drive ladder generically
for (let g = 0; g < 40; g++) {
  if (await p.locator('text=Next ➜').count()) break
  if (await p.locator('.yn').count()) { const txt = await p.locator('.prompt').innerText(); const m = txt.match(/(\d+) \w+\. Take (\d+)/); await p.click(+m[1] >= +m[2] ? '.yes' : '.no'); await p.waitForTimeout(150); continue }
  if (await p.locator('.hint').count()) { await p.screenshot({ path: 'shots/6-break.png' }); const act = p.locator('.bcol.active'); const col = +(await act.getAttribute('data-col'));
    let src = p.locator(`.bcol[data-col="${col+1}"] .blk:not(.gone)`); if (!(await src.count())) src = p.locator(`.bcol[data-col="${col+2}"] .blk:not(.gone)`)
    const bx = await src.first().boundingBox(), tb = await p.locator(`.bcol[data-col="${col}"]`).boundingBox()
    // drag hundreds->tens or tens->ones
    const srcCol = (await src.first().evaluate(e => e.closest('[data-col]').dataset.col)); const tgt = await p.locator(`.bcol[data-col="${srcCol-1}"]`).boundingBox()
    await p.mouse.move(bx.x+5, bx.y+5); await p.mouse.down(); await p.mouse.move(tgt.x+tgt.width/2, tgt.y+100, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(700); continue }
  if (await p.locator('.lside .pad').count()) { const txt = await p.locator('.prompt').innerText(); const m = txt.match(/(\d+) − (\d+)/); for (const d of String(m[1]-m[2])) await p.click(`.keys button:text-is("${d}")`); await p.click('.go'); await p.waitForTimeout(200); continue }
}
await p.screenshot({ path: 'shots/7-ladder-done.png' }); await p.click('text=Next ➜'); await p.waitForTimeout(300)
await p.click('text=Practice'); await p.waitForTimeout(400)
// wrong answer to trigger fix-it: flip pattern
const vt = await p.locator('.vert .row').allInnerTexts()
const a = parseInt(vt[0].replace(/\D/g,'')), b2 = parseInt(vt[1].replace(/\D/g,''))
const A=[a%10,(a/10|0)%10,a/100|0],B=[b2%10,(b2/10|0)%10,b2/100|0]; const flip=Math.abs(A[0]-B[0])+10*Math.abs(A[1]-B[1])+100*Math.abs(A[2]-B[2])
for (const d of String(flip)) await p.click(`.keys button:text-is("${d}")`); await p.click('.go'); await p.waitForTimeout(500)
await p.screenshot({ path: 'shots/8-fixit.png' }); console.log('fix title:', await p.locator('.title').innerText())
await p.goto(U); await p.waitForTimeout(400)
await p.evaluate(async () => { const req = indexedDB.open('keyval-store'); await new Promise(r => req.onsuccess = r); const db = req.result; const tx = db.transaction('keyval', 'readwrite'); const st = tx.objectStore('keyval'); const g = st.get('sean-math'); await new Promise(r => g.onsuccess = r); const s = g.result; const d = new Date().toLocaleDateString('en-CA'); s.days[d].done = ['sprint','warmup','learn','practice']; st.put(s, 'sean-math'); await new Promise(r => tx.oncomplete = r) })
await p.reload(); await p.waitForTimeout(400); await p.click('text=Start'); await p.click('text=Review'); await p.waitForTimeout(400)
for (let k = 0; k < 5; k++) { await p.screenshot({ path: `shots/9-review${k}.png` }); if (await p.locator('.choices').count()) { await p.locator('.choices button').first().click() } else { await p.click('.keys button:text-is("1")'); await p.click('.go') } await p.waitForTimeout(400); if (await p.locator('.choices, .pad').count()) { if (await p.locator('.choices').count()) await p.locator('.choices button').nth(1).click(); else { await p.click('.keys button:text-is("2")'); await p.click('.go') } } await p.waitForTimeout(2800) }
await p.screenshot({ path: 'shots/10-reward.png' })
await p.goto(U); await p.waitForTimeout(400); await p.click('.gear'); for (const d of '2468') await p.click(`.keys button:text-is("${d}")`); await p.click('.go'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/11-parent.png', fullPage: true })
const sw = await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => !!r)); console.log('sw', sw)
await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(500); console.log('offline home:', await p.locator('.start').count())
await p.setViewportSize({ width: 1280, height: 800 }); await p.screenshot({ path: 'shots/12-android-offline.png' })
console.log('errors', errs); await b.close()
