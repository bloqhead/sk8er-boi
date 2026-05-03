/**
 * SkaterAnimator — drives the skater spritesheet + a separate board trick layer.
 *
 * Tricks are performed by the BOARD graphic only, while the body stays upright.
 * This reads much more like real skateboarding:
 *   - Ollie:    board stays flat, player tucks knees
 *   - Kickflip: board rotates around its long axis (heel-to-toe flip)
 *   - Heelflip: board rotates opposite direction
 *   - Shove-it: board spins 180° horizontally (backside)
 *   - 360 flip: board spins 360° horizontal + one flip
 *   - Nosegrab: board stays flat, front hand reaches down to nose
 *   - Tailgrab: board stays flat, back hand reaches to tail
 */

const TRICKS = {
  OLLIE:     { boardFlip: 0,   boardSpin: 0,    label: 'OLLIE' },
  KICKFLIP:  { boardFlip: 1,   boardSpin: 0,    label: 'KICKFLIP' },
  HEELFLIP:  { boardFlip: -1,  boardSpin: 0,    label: 'HEELFLIP' },
  'SHOVE-IT':{ boardFlip: 0,   boardSpin: 0.5,  label: 'SHOVE-IT' },
  '360 FLIP':{ boardFlip: 1,   boardSpin: 1,    label: '360 FLIP' },
  VARIAL:    { boardFlip: -1,  boardSpin: 0.5,  label: 'VARIAL' },
  NOSEGRAB:  { boardFlip: 0,   boardSpin: 0,    grab: 'nose',  label: 'NOSEGRAB' },
  TAILGRAB:  { boardFlip: 0,   boardSpin: 0,    grab: 'tail',  label: 'TAILGRAB' },
  HARDFLIP:  { boardFlip: -1,  boardSpin: 0.5,  label: 'HARDFLIP' },
  CROOKED:   { boardFlip: 0,   boardSpin: 0.25, label: 'CROOKED' },
}

export const TRICK_NAMES = Object.keys(TRICKS)

export class SkaterAnimator {
  constructor(sprite, scene) {
    this.sprite      = sprite
    this.scene       = scene
    this._state      = 'rolling'
    this._frametime  = 0
    this._pushCycle  = 0
    this._currentFrame = null

    // Separate board graphic for mid-air tricks
    this._board      = null
    this._trickName  = null
    this._trickTime  = 0
    this._trickDur   = 0
    this._boardFlips = 0
    this._boardSpins = 0
    this._grabType   = null
    this._inTrick    = false
  }

  update(state, delta, speed = 300) {
    const speedFactor = Math.max(0.5, speed / 320)

    switch (state) {
      case 'rolling':
        this._animateRoll(delta, speedFactor)
        this._destroyBoard()
        break
      case 'charging':
        this._setFrame('charge')
        this._destroyBoard()
        break
      case 'airborne':
        this._setFrame('ollie')
        this._updateTrick(delta)
        break
      case 'grinding':
        this._setFrame('grind')
        this._destroyBoard()
        break
      case 'crashed':
        this._setFrame('crash')
        this._destroyBoard()
        break
      default:
        this._setFrame('roll_a')
        this._destroyBoard()
    }
  }

  // Called by Player when a trick is chosen
  startTrick(name, airDuration = 600) {
    const def = TRICKS[name] || TRICKS['OLLIE']
    this._trickName  = name
    this._trickTime  = 0
    this._trickDur   = airDuration
    this._boardFlips = def.boardFlip
    this._boardSpins = def.boardSpin
    this._grabType   = def.grab || null
    this._inTrick    = true
    this._createBoard()
  }

  stopTrick() {
    this._inTrick = false
    this._destroyBoard()
  }

  _createBoard() {
    this._destroyBoard()
    // Board is a separate graphics object that sits below the player sprite
    const g = this.scene.add.graphics().setDepth(9)
    // Draw a simple skateboard: long rectangle + two wheel axles
    const bw = 30, bh = 5
    g.fillStyle(0xC8860A, 1)
    g.fillRect(-bw/2, -bh/2, bw, bh)
    // Nose/tail kicks
    g.fillTriangle(-bw/2-3, bh/2,  -bw/2, -bh/2,  -bw/2, bh/2)
    g.fillTriangle( bw/2+3, bh/2,   bw/2, -bh/2,   bw/2, bh/2)
    // Trucks
    g.fillStyle(0x888888, 1)
    g.fillRect(-bw/2+3, bh/2, 8, 3)
    g.fillRect( bw/2-11, bh/2, 8, 3)
    // Wheels
    g.fillStyle(0x333333, 1)
    g.fillCircle(-bw/2+4,  bh/2+4, 3)
    g.fillCircle(-bw/2+10, bh/2+4, 3)
    g.fillCircle( bw/2-5,  bh/2+4, 3)
    g.fillCircle( bw/2-11, bh/2+4, 3)
    // Grip tape
    g.fillStyle(0x222222, 0.5)
    g.fillRect(-bw/2+2, -bh/2, bw-4, 2)

    this._board = g
  }

  _updateTrick(delta) {
    if (!this._board) return

    // Position board below player centre
    const bx = this.sprite.x
    const by = this.sprite.y + 20  // below feet

    if (!this._inTrick) {
      // No trick, board just floats flat below feet
      this._board.x = bx
      this._board.y = by
      this._board.rotation = 0
      this._board.scaleX   = 1
      return
    }

    this._trickTime += delta
    const t = Math.min(this._trickTime / this._trickDur, 1)

    // Smooth ease in/out with sine
    const ease = Math.sin(t * Math.PI)  // 0→1→0 arc

    // Board flip (kickflip/heelflip): scaleX oscillates −1 to 1
    // We simulate a Y-axis flip by scaling X
    const flipAngle = this._boardFlips * ease * Math.PI * 2
    const flipScaleX = Math.cos(flipAngle)  // −1..1 creates the flip illusion

    // Board spin (shove-it): rotation around Z
    const spinRot = this._boardSpins * ease * Math.PI * 2

    // During trick board pops up slightly then comes back
    const boardLift = ease * -16  // negative = up

    this._board.x        = bx
    this._board.y        = by + boardLift
    this._board.scaleX   = flipScaleX
    this._board.rotation = spinRot

    // Grab: override and stop board movement, extend hand graphic
    // (hand is simulated by temporarily scaling the sprite)
    if (this._grabType && t > 0.3 && t < 0.7) {
      this._board.y     = by - 8   // board pulled up to hand
      this._board.scaleX = 1
      this._board.rotation = 0
    }

    // End of trick — snap back
    if (t >= 1) {
      this._inTrick = false
      this._board.rotation = 0
      this._board.scaleX   = 1
    }
  }

  _destroyBoard() {
    if (this._board) {
      this._board.destroy()
      this._board = null
    }
    this._inTrick = false
  }

  _animateRoll(delta, speedFactor) {
    this._frametime += delta
    const pushInterval = 500 / speedFactor
    const rollInterval = 200 / speedFactor

    if (this._pushCycle < 2) {
      const frames = ['push_a', 'push_b']
      const idx = Math.floor(this._frametime / pushInterval) % 2
      this._setFrame(frames[idx])
      if (this._frametime > pushInterval * 2) {
        this._frametime = 0
        this._pushCycle++
      }
    } else {
      const frames = ['roll_a', 'roll_b']
      const idx = Math.floor(this._frametime / rollInterval) % 2
      this._setFrame(frames[idx])
      if (this._frametime > rollInterval * 4) {
        this._frametime = 0
        this._pushCycle = 0
      }
    }
  }

  _setFrame(name) {
    if (this._currentFrame === name) return
    this._currentFrame = name
    this.sprite.setFrame(name)
  }

  forceReset() {
    this._currentFrame = null
    this._frametime    = 0
    this._pushCycle    = 0
    this._inTrick      = false
    this._destroyBoard()
  }
}
