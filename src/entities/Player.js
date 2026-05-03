import { GAME_CONSTANTS } from '../data/levels.js'
import { SkaterAnimator, TRICK_NAMES } from '../systems/SkaterAnimator.js'
import { audio } from '../audio/AudioManager.js'

const STATE = {
  ROLLING:  'rolling',
  CHARGING: 'charging',
  AIRBORNE: 'airborne',
  GRINDING: 'grinding',
  CRASHED:  'crashed',
  DEAD:     'dead',
}

const AIR_MOVE_SPEED = 160

export class Player {
  constructor(scene, x, y) {
    this.scene           = scene
    this.state           = STATE.ROLLING
    this.chargeTime      = 0
    this._jumpHeld       = false   // unified "button was held last frame" for edge detection
    this.invincibleTimer = 0
    this.lives           = GAME_CONSTANTS.LIVES
    this.score           = 0
    this.tricks          = 0
    this.combo           = 0
    this.grindTime       = 0
    this.airTime         = 0
    this._trickDone      = false
    this._baseX          = x
    this._targetX        = x
    this._xLerpSpeed     = 3.5

    this._create(x, y)
    this._bindInput()
    this.animator = new SkaterAnimator(this.sprite, scene)
  }

  _create(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, 'skater', 'roll_a')
    this.sprite.setDepth(10)
    // Tight hitbox — torso only
    this.sprite.body.setSize(16, 26)
    this.sprite.body.setOffset(10, 15)
    this.sprite.body.setMaxVelocityY(900)
    this.sprite.body.setCollideWorldBounds(false)
    this.sprite.body.allowGravity = true
  }

  _bindInput() {
    const kb = this.scene.input.keyboard
    this.keys = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      p:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      esc:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    }
  }

  get x()             { return this.sprite.x }
  get y()             { return this.sprite.y }
  get body()          { return this.sprite.body }
  get isDead()        { return this.state === STATE.DEAD }
  get isInvincible()  { return this.invincibleTimer > 0 }
  get chargePercent() { return Math.min(this.chargeTime / GAME_CONSTANTS.JUMP_CHARGE_TIME, 1) }
  get onGround()      { return this.sprite.body.blocked.down }

  setSpeedPosition(gameSpeed, baseSpeed, maxSpeed) {
    const t = Phaser.Math.Clamp((gameSpeed - baseSpeed) / (maxSpeed - baseSpeed), -0.5, 1)
    this._targetX = this._baseX + t * 60 - (t < 0 ? Math.abs(t) * 40 : 0)
  }

  update(delta, gameSpeed) {
    if (this.state === STATE.DEAD) return

    this.invincibleTimer = Math.max(0, this.invincibleTimer - delta)

    // P / ESC → pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.p) ||
        Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this.scene.scene.launch('PauseScene')
      this.scene.scene.pause('GameScene')
      this.scene.scene.pause('HUDScene')
      return
    }

    // Smooth X slide
    if (this.state !== STATE.CRASHED) {
      const lerpT = 1 - Math.pow(1 - this._xLerpSpeed * 0.01, delta / 16)
      this.sprite.x = Phaser.Math.Linear(this.sprite.x, this._targetX, lerpT)
    }

    // ── Unified jump edge detection ───────────────────────────────────
    // Treat keyboard and DOM button as one logical button.
    // "held" = either source is currently active.
    // We track whether WE decided it was "down" last frame via _jumpHeld.
    const kbDown  = this.keys.up.isDown || this.keys.space.isDown
    const domDown = !!window._sk8_ollie
    const jumpHeld = kbDown || domDown

    const jumpJustPressed  = jumpHeld  && !this._jumpHeld   // low→high edge
    const jumpJustReleased = !jumpHeld && this._jumpHeld    // high→low edge

    const slowDown = this.keys.left.isDown  || !!window._sk8_slow
    const speedUp  = this.keys.right.isDown || !!window._sk8_fast

    // ── Airborne: board trick + air movement (NO sprite rotation) ────
    if (this.state === STATE.AIRBORNE) {
      this.airTime += delta

      if (slowDown) {
        const newX = Math.max(20, this.sprite.x - AIR_MOVE_SPEED * (delta / 1000))
        this.sprite.x = newX; this._targetX = newX
      } else if (speedUp) {
        const newX = Math.min(this._baseX + 130, this.sprite.x + AIR_MOVE_SPEED * (delta / 1000))
        this.sprite.x = newX; this._targetX = newX
      }

      if (!this._trickDone && this.airTime > 200 && Math.random() < 0.003 * delta) {
        this._doMidAirTrick()
      }
    } else {
      this.sprite.rotation = 0
      this.airTime         = 0
      this._trickDone      = false
    }

    switch (this.state) {
      case STATE.ROLLING:  this._handleRolling(delta, jumpJustPressed, slowDown, speedUp); break
      case STATE.CHARGING: this._handleCharging(delta, jumpJustReleased); break
      case STATE.AIRBORNE: this._handleAirborne(); break
      case STATE.GRINDING: this._handleGrinding(delta, jumpJustPressed); break
      case STATE.CRASHED:  this._handleCrashed(delta); break
    }

    // Store unified state for next frame
    this._jumpHeld = jumpHeld

    if (this.sprite.y > this.scene.scale.height + 60) this.crash()
    this.animator.update(this.state, delta, gameSpeed)
  }

  _handleRolling(dt, jumpJustPressed, slowDown, speedUp) {
    if (this.onGround) this.scene.particles.spawnWheelSmoke(this.x - 8, this.y + 16)

    if (jumpJustPressed && this.onGround) {
      this.state      = STATE.CHARGING
      this.chargeTime = 0
      audio.resume()
      return
    }
    if (slowDown)     this.scene.reduceSpeed()
    else if (speedUp) this.scene.increaseSpeed()
  }

  _handleCharging(dt, jumpJustReleased) {
    this.chargeTime += dt
    const maxed = this.chargeTime >= GAME_CONSTANTS.JUMP_CHARGE_TIME * 1.5
    if (jumpJustReleased || maxed) this._launch()
  }

  _launch() {
    const pct      = this.chargePercent
    const power    = Phaser.Math.Linear(GAME_CONSTANTS.JUMP_POWER_MIN, GAME_CONSTANTS.JUMP_POWER_MAX, pct)
    const trickIdx = Math.min(Math.floor(pct * TRICK_NAMES.length), TRICK_NAMES.length - 1)
    const trickName = TRICK_NAMES[trickIdx]
    const airDur   = 400 + pct * 400

    this.sprite.body.setVelocityY(power)
    this.state = STATE.AIRBORNE
    this.chargeTime = 0
    this._currentTrickName = trickName

    // Reset animation state cleanly, then start trick
    this.animator.forceReset()
    this.animator.startTrick(trickName, airDur)

    this.scene.particles.spawnOllieParticles(this.x, this.y + 12, pct)
    audio.playOllie(pct)
    this.score += GAME_CONSTANTS.SCORE_OLLIE
    this.scene.events.emit('score-update', this.score)
  }

  _handleAirborne() {
    if (this.onGround) this._land()
  }

  _land() {
    this.state    = STATE.ROLLING
    this._targetX = this.sprite.x
    this.animator.stopTrick()
    this.scene.particles.spawnLandParticles(this.x, this.y + 16)
    audio.playLand()
    if (this._trickDone) {
      this.combo++
      this.score += GAME_CONSTANTS.SCORE_TRICK * this.combo
      this.scene.events.emit('score-update', this.score)
      this.scene.events.emit('trick', this._currentTrickName || 'TRICK')
    } else {
      this.combo = Math.max(0, this.combo - 1)
    }
    this._currentTrickName = null
    this.animator.forceReset()
  }

  _doMidAirTrick() {
    if (this._trickDone) return
    this._trickDone = true
    this.tricks++
    audio.playScoreUp(this.combo + 1)
  }

  _handleGrinding(dt, jumpJustPressed) {
    this.grindTime += dt
    if (jumpJustPressed && this.onGround) {
      this.sprite.body.setVelocityY(-600)
      this.state     = STATE.AIRBORNE
      audio.playOllie(0.6)
      this.grindTime = 0
      this.animator.startTrick('SHOVE-IT', 400)
      return
    }
    if (!this.onGround) { this.state = STATE.AIRBORNE; this.grindTime = 0; return }
    const pts = Math.floor(this.grindTime / 80) * GAME_CONSTANTS.SCORE_RAIL
    if (pts > 0) {
      this.score    += pts; this.grindTime = 0
      this.scene.particles.spawnGrindSparks(this.x, this.y + 14)
      audio.playGrind()
      this.scene.events.emit('score-update', this.score)
    }
  }

  _handleCrashed(dt) {
    this.chargeTime += dt
    if (this.chargeTime > 1000) {
      if (this.lives > 0) this._respawn()
      else { this.state = STATE.DEAD; this.scene.events.emit('player-dead') }
    }
  }

  crash() {
    if (this.isInvincible || this.state === STATE.CRASHED || this.state === STATE.DEAD) return
    this.lives--; this.combo = 0; this.state = STATE.CRASHED; this.chargeTime = 0
    this.sprite.rotation = 0
    this.sprite.body.setVelocityY(-250)
    this.sprite.body.setVelocityX(-80)
    this.animator.stopTrick()
    this.scene.particles.spawnCrashParticles(this.x, this.y)
    audio.playCrash()
    this.scene.events.emit('crash', this.lives)
    this.scene.cameras.main.shake(250, 0.006)
  }

  _respawn() {
    this.state = STATE.ROLLING; this.chargeTime = 0
    this.sprite.body.setVelocityX(0); this.sprite.body.setVelocityY(0)
    this.sprite.rotation = 0
    this._targetX = this._baseX
    this.invincibleTimer = GAME_CONSTANTS.INVINCIBLE_TIME
    this.animator.forceReset()
    this.scene.tweens.add({
      targets: this.sprite, alpha: { from: 0.3, to: 1 },
      duration: 120, repeat: 7, yoyo: true,
      onComplete: () => this.sprite.setAlpha(1),
    })
  }

  startGrind() {
    if (this.state === STATE.CRASHED || this.state === STATE.DEAD) return
    this.state = STATE.GRINDING; this.grindTime = 0
    this.sprite.rotation = 0
    this.animator.stopTrick()
    audio.playGrind()
    this.scene.events.emit('grind-start')
  }

  rampLaunch(boost = 1.0) {
    if (this.state === STATE.CRASHED || this.state === STATE.DEAD) return
    this.sprite.body.setVelocityY(GAME_CONSTANTS.JUMP_POWER_MIN * 0.85 * boost)
    this.state = STATE.AIRBORNE
    this.animator.startTrick('360 FLIP', 500)
    this.scene.particles.spawnRampLaunchEffect(this.x, this.y)
    audio.playOllie(0.75)
    this.scene.events.emit('ramp-launch')
  }

  destroy() { this.sprite.destroy() }
}
