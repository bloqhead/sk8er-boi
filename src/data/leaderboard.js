const STORAGE_KEY = 'sk8er_boi_leaderboard_v1'
const MAX_ENTRIES = 20

export class Leaderboard {
  static getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  static save(initials, score, level, tricks) {
    const entries = this.getAll()
    const entry = {
      initials: initials.toUpperCase().slice(0, 3).padEnd(3, '_'),
      score,
      level,
      tricks,
      date: new Date().toISOString().split('T')[0]
    }
    entries.push(entry)
    entries.sort((a, b) => b.score - a.score)
    const trimmed = entries.slice(0, MAX_ENTRIES)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {}
    return trimmed
  }

  static getTopN(n = 10) {
    return this.getAll().slice(0, n)
  }

  static getRank(score) {
    const entries = this.getAll()
    const rank = entries.findIndex(e => score >= e.score)
    return rank === -1 ? entries.length + 1 : rank + 1
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY)
  }

  static seedWithDemoData() {
    const entries = this.getAll()
    if (entries.length > 0) return
    const demo = [
      { initials: 'ACE', score: 98400, level: 4, tricks: 47, date: '2026-04-28' },
      { initials: 'RAD', score: 76200, level: 4, tricks: 38, date: '2026-04-27' },
      { initials: 'TKO', score: 54800, level: 3, tricks: 29, date: '2026-04-26' },
      { initials: 'JOE', score: 42100, level: 3, tricks: 22, date: '2026-04-25' },
      { initials: 'SKZ', score: 31600, level: 2, tricks: 17, date: '2026-04-24' },
      { initials: 'CAL', score: 24400, level: 2, tricks: 13, date: '2026-04-23' },
      { initials: 'DEX', score: 18200, level: 1, tricks: 9, date: '2026-04-22' },
      { initials: 'MAX', score: 11100, level: 1, tricks: 5, date: '2026-04-21' },
    ]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
    } catch {}
  }
}
