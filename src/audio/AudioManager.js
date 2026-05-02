export class AudioManager {
  constructor() {
    this.ctx = null
    this.enabled = true
    this.volume = 0.5
    this.init()
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      this.enabled = false
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  _master(gain = 0.5) {
    if (!this.ctx || !this.enabled) return null
    const g = this.ctx.createGain()
    g.gain.value = gain * this.volume
    g.connect(this.ctx.destination)
    return g
  }

  _osc(type, freq, startTime, duration, gainVal = 0.3, dest = null) {
    if (!this.ctx || !this.enabled) return
    const g = dest || this._master(gainVal)
    if (!g) return
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)
    osc.connect(g)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  playOllie(power = 0.5) {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.4)
    const freq = 80 + power * 140
    this._osc('square', freq, t, 0.04, 0.4, g)
    this._osc('square', freq * 1.5, t + 0.02, 0.08, 0.2, g)
    this._osc('sawtooth', freq * 0.5, t, 0.06, 0.3, g)
  }

  playLand() {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.35)
    // Thud
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, t)
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12)
    osc.connect(g)
    osc.start(t)
    osc.stop(t + 0.12)
    // Click
    this._osc('square', 800, t, 0.02, 0.2, g)
  }

  playGrind() {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.2)
    const noise = this.ctx.createOscillator()
    noise.type = 'sawtooth'
    noise.frequency.setValueAtTime(180 + Math.random() * 40, t)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 2
    noise.connect(filter)
    filter.connect(g)
    noise.start(t)
    noise.stop(t + 0.15)
  }

  playCrash() {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.5)
    // Low impact
    const osc1 = this.ctx.createOscillator()
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(200, t)
    osc1.frequency.exponentialRampToValueAtTime(20, t + 0.4)
    osc1.connect(g)
    osc1.start(t)
    osc1.stop(t + 0.4)
    // High screech
    this._osc('square', 600, t, 0.08, 0.3, g)
    this._osc('square', 300, t + 0.05, 0.2, 0.25, g)
  }

  playScoreUp(combo = 1) {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.25)
    const base = 440 * Math.min(combo, 4)
    this._osc('square', base, t, 0.06, 0.3, g)
    this._osc('square', base * 1.25, t + 0.06, 0.06, 0.25, g)
    this._osc('square', base * 1.5, t + 0.12, 0.1, 0.2, g)
  }

  playLevelUp() {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.4)
    const notes = [261, 330, 392, 523, 659, 784]
    notes.forEach((f, i) => {
      this._osc('square', f, t + i * 0.09, 0.12, 0.3, g)
    })
  }

  playSpeedUp() {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.2)
    this._osc('sawtooth', 200, t, 0.05, 0.25, g)
    this._osc('sawtooth', 280, t + 0.05, 0.05, 0.2, g)
  }

  playSlowDown() {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.2)
    this._osc('sawtooth', 280, t, 0.05, 0.2, g)
    this._osc('sawtooth', 180, t + 0.05, 0.08, 0.2, g)
  }

  playMenuBeep(freq = 440) {
    if (!this.ctx || !this.enabled) return
    this.resume()
    const t = this.ctx.currentTime
    const g = this._master(0.2)
    this._osc('square', freq, t, 0.06, 0.2, g)
  }

  startRolling() {
    if (!this.ctx || !this.enabled || this._rollingNode) return
    this.resume()
    const g = this._master(0.08)
    if (!g) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 90
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200
    osc.connect(filter)
    filter.connect(g)
    osc.start()
    this._rollingNode = osc
    this._rollingGain = g
  }

  stopRolling() {
    if (this._rollingNode) {
      try { this._rollingNode.stop() } catch {}
      this._rollingNode = null
      this._rollingGain = null
    }
  }

  setVolume(v) {
    this.volume = Phaser.Math.Clamp(v, 0, 1)
  }
}

export const audio = new AudioManager()
