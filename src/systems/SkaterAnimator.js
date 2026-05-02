// Drives the skater spritesheet based on player state
// All animation state lives here, Player just calls .setState()

const FW = 12 * 3  // frame width in canvas pixels (logical 12 × scale 3)
const FH = 18 * 3

export class SkaterAnimator {
  constructor(sprite) {
    this.sprite = sprite
    this._state = 'roll'
    this._frame = 0
    this._frametime = 0
    this._pushCycle = 0  // alternates push_a / push_b
    this._rollCycle = 0
  }

  // Called from Player.update() with current state string and delta
  update(state, delta, speed = 300) {
    const dt = delta

    // Speed scales animation rate — faster skating = faster leg turnover
    const speedFactor = Math.max(0.5, speed / 320)

    switch (state) {
      case 'rolling':
        this._animateRoll(dt, speedFactor)
        break
      case 'charging':
        this._setFrame('charge')
        break
      case 'airborne':
        this._setFrame('ollie')
        break
      case 'grinding':
        this._setFrame('grind')
        break
      case 'crashed':
        this._setFrame('crash')
        break
      default:
        this._setFrame('roll_a')
    }
  }

  _animateRoll(dt, speedFactor) {
    // Alternate between roll_a and push frames for a push cycle
    this._frametime += dt

    const pushInterval   = 500 / speedFactor   // ms per push cycle step
    const rollInterval   = 220 / speedFactor    // ms per roll bob step

    if (this._pushCycle < 2) {
      // During push phase
      const frames = ['push_a', 'push_b']
      const idx = Math.floor(this._frametime / pushInterval) % 2
      this._setFrame(frames[idx])
      if (this._frametime > pushInterval * 2) {
        this._frametime = 0
        this._pushCycle++
        this._rollCycle = 0
      }
    } else {
      // Brief glide/coast phase — just roll bob
      const frames = ['roll_a', 'roll_b']
      const idx = Math.floor(this._frametime / rollInterval) % 2
      this._setFrame(frames[idx])
      if (this._frametime > rollInterval * 4) {
        this._frametime = 0
        this._pushCycle = 0  // restart push cycle
      }
    }
  }

  _setFrame(frameName) {
    if (this._currentFrame === frameName) return
    this._currentFrame = frameName
    // Map frame name to x offset in the spritesheet
    const frameIndex = {
      roll_a: 0, roll_b: 1, push_a: 2, push_b: 3,
      charge: 4, ollie: 5, grind: 6, crash: 7
    }
    const fi = frameIndex[frameName] ?? 0
    this.sprite.setFrame(frameName)
  }

  forceReset() {
    this._currentFrame = null
    this._frametime = 0
    this._pushCycle = 0
  }
}
