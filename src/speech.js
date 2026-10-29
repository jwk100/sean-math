let on = true
export const setAudio = (v) => { on = v }
export function say(text) {
  if (!on || !('speechSynthesis' in window) || !text) return
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/−/g, ' minus ')); u.rate = 0.85; u.pitch = 1.1; u.lang = 'en-US'; speechSynthesis.speak(u) } catch (e) {}
}
