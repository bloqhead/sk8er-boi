import { GAME_CONSTANTS } from '../data/levels.js'
import { SkaterAnimator } from '../systems/SkaterAnimator.js'
import { audio } from '../audio/AudioManager.js'

const STATE = {
  ROLLING:  'rolling',
  CHARGING: 'charging',
  AIRBORNE: 'airborne',
  GRINDING: 'grinding',
  CRASHED:  'crashed',
  DEAD:     'dead'
}

const TRICKS = [
  'KICKFLIP', 'HEELFLIP', '360 FLIP', 'VARIAL',
  'HARDFLIP', 'SHOVE-IT', 'NOSEGRAB', 'TAILGRAB', 'CROOKED'
]

export class Player {
  constructor(scene, x, y) {
    this.scene    = scene
    this.state    = STATE.ROLLING
    this.chargeTime     = 0
    this.invincibleTimer= 0
    this.lives    = GAME_CONSTANTS.LIVES
    this.score    = 0
    this.tricks   = 0
    this.combo    = 0
    this.grindTime= 0
    this.airTime  = 0
    this.spinSpeed= 0
    this._trickDone = false

    // X positioning — player slides forward/back based on speed
    this._baseX       = x          // neutral position
    this._targetX     = x          // where we want to be
    this._xLerpSpeed  = 3.5        // how fast we slide (lerp factor per second)

    this._create(x, y)
    this._bindInput()

    this.animator = new SkaterAnimator(this.sprite)
  }

  _create(x, y) {
    // Use the spritesheet with named frames
    this.sprite = this.scene.physics.add.sprite(x, y, 'skater', 'roll_a')
    this.sprite.setDepth(10)

    // Tight hitbox — slightly narrower than the sprite
    this.sprite.body.setSize(24, 40)
    this.sprite.body.setOffset(12, 10)
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
      z:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
    }
  }

  // ─── Accessors ───────────────────────────────────────────────────────
  get x()             { return this.sprite.x }
  get y()             { return this.sprite.y }
  get body()          { return this.sprite.body }
  get isDead()        { return this.state === STATE.DEAD }
  get isInvincible()  { return this.invincibleTimer > 0 }
  get chargePercent() { return Math.min(this.chargeTime / GAME_CONSTANTS.JUMP_CHARGE_TIME, 1) }
  get onGround()      { return this.sprite.body.blocked.down }

  // Called by GameScene whenever speed changes — slides player forward/back
  setSpeedPosition(gameSpeed, baseSpeed, maxSpeed) {
    // Normalise speed 0..1 across the speed range
    const t = Phaser.Math.Clamp((gameSpeed - baseSpeed) / (maxSpeed - baseSpeed), -0.5, 1)
    // At neutral: baseX. Speeding up: push forward +60px. Slowing down: pull back -40px.
    this._targetX = this._baseX + t * 60 - (t < 0 ? Math.abs(t) * 40 : 0)
  }

  // ─── Main update ─────────────────────────────────────────────────────
  update(delta, gameSpeed) {
    if (this.state === STATE.DEAD) return

    this.invincibleTimer = Math.max(0, this.invincibleTimer - delta)

    // Smooth X slide toward target (not during crash so we don't fight knockback)
    if (this.state !== STATE.CRASHED && this.state !== STATE.DEAD) {
      const lerpT = 1 - Math.pow(1 - this._xLerpSpeed * 0.01, delta / 16)
      this.sprite.x = Phaser.Math.Linear(this.sprite.x, this._targetX, lerpT)
    }

    const jumpDown  = this.keys.up.isDown    || this.keys.space.isDown || this.scene._mobileJump
    const slowDown  = this.keys.left.isDown  || this.scene._mobileSlowDown
    const speedUp   = this.keys.right.isDown || this.scene._mobileSpeedUp

    // Airborne rotation
    if (this.state === STATE.AIRBORNE) {
      this.airTime += delta
      this.sprite.rotation += this.spinSpeed * (delta / 1000)
      if (!this._trickDone && this.airTime > 180 && Math.random() < 0.003 * delta) {
        this._doMidAirTrick()
      }
    } else {
      this.sprite.rotation = 0
      this.airTime = 0
      this._trickDone = false
    }

    // Invincibility blink already handled in _respawn tween

    switch (this.state) {
      case STATE.ROLLING:  this._handleRolling(delta, jumpDown, slowDown, speedUp); break
      case STATE.CHARGING: this._handleCharging(delta, jumpDown); break
      case STATE.AIRBORNE: this._handleAirborne(delta); break
      case STATE.GRINDING: this._handleGrinding(delta, jumpDown); break
      case STATE.CRASHED:  this._handleCrashed(delta); break
    }

    // Fell off bottom
    if (this.sprite.y > this.scene.scale.height + 60) this.crash()

    // Drive animation
    this.animator.update(this.state, delta, gameSpeed)
  }

  // ─── State handlers ──────────────────────────────────────────────────
  _handleRolling(dt, jumpDown, slowDown, speedUp) {
    if (this.onGround) {
      this.scene.particles.spawnWheelSmoke(this.x - 8, this.y + 16)
    }
    if (jumpDown && this.onGround) {
      this.state = STATE.CHARGING
      this.chargeTime = 0
      audio.resume()
    }
    if (slowDown)      this.scene.reduceSpeed()
    else if (speedUp)  this.scene.increaseSpeed()
  }

  _handleCharging(dt, jumpDown) {
    this.chargeTime += dt
    if (!jumpDown || this.chargeTime >= GAME_CONSTANTS.JUMP_CHARGE_TIME * 1.5) {
      this._launch()
    }
  }

  _launch() {
    const pct   = this.chargePercent
    const power = Phaser.Math.Linear(GAME_CONSTANTS.JUMP_POWER_MIN, GAME_CONSTANTS.JUMP_POWER_MAX, pct)
    this.sprite.body.setVelocityY(power)
    this.spinSpeed = pct * 5 + 1
    this.state = STATE.AIRBORNE
    this.scene.particles.spawnOllieParticles(this.x, this.y + 12, pct)
    audio.playOllie(pct)
    this.score += GAME_CONSTANTS.SCORE_OLLIE
    this.scene.events.emit('score-update', this.score)
    this.chargeTime = 0
    this.animator.forceReset()
  }

  _handleAirborne(dt) {
    if (this.onGround) this._land()
  }

  _land() {
    this.state = STATE.ROLLING
    this.scene.particles.spawnLandParticles(this.x, this.y + 16)
    audio.playLand()
    if (this._trickDone) {
      this.combo++
      this.score += GAME_CONSTANTS.SCORE_TRICK * this.combo
      this.scene.events.emit('score-update', this.score)
    } else {
      this.combo = Math.max(0, this.combo - 1)
    }
    this.animator.forceReset()
  }

  _doMidAirTrick() {
    if (this._trickDone) return
    this._trickDone = true
    this.tricks++
    const name = TRICKS[Math.floor(Math.random() * TRICKS.length)]
    this.scene.particles.spawnTrickEffect(this.x, this.y, name)
    audio.playScoreUp(this.combo + 1)
    this.score += GAME_CONSTANTS.SCORE_TRICK
    this.scene.events.emit('score-update', this.score)
    this.scene.events.emit('trick', name)
  }

  _handleGrinding(dt, jumpDown) {
    this.grindTime += dt

    if (jumpDown && this.onGround) {
      this.sprite.body.setVelocityY(-600)
      this.state = STATE.AIRBORNE
      this.spinSpeed = 3
      audio.playOllie(0.6)
      this.grindTime = 0
      return
    }
    if (!this.onGround) {
      this.state = STATE.AIRBORNE
      this.grindTime = 0
      return
    }

    // Score ticks while grinding
    const pts = Math.floor(this.grindTime / 80) * GAME_CONSTANTS.SCORE_RAIL
    if (pts > 0) {
      this.score += pts
      this.grindTime = 0
      this.scene.particles.spawnGrindSparks(this.x, this.y + 14)
      audio.playGrind()
      this.scene.events.emit('score-update', this.score)
    }
  }

  _handleCrashed(dt) {
    this.chargeTime += dt
    if (this.chargeTime > 1000) {
      if (this.lives > 0) this._respawn()
      else {
        this.state = STATE.DEAD
        this.scene.events.emit('player-dead')
      }
    }
  }

  // ─── Public actions ──────────────────────────────────────────────────
  crash() {
    if (this.isInvincible || this.state === STATE.CRASHED || this.state === STATE.DEAD) return
    this.lives--
    this.combo = 0
    this.state = STATE.CRASHED
    this.chargeTime = 0
    this.sprite.body.setVelocityY(-250)
    this.sprite.body.setVelocityX(-80)
    this.scene.particles.spawnCrashParticles(this.x, this.y)
    audio.playCrash()
    this.scene.events.emit('crash', this.lives)
    this.scene.cameras.main.shake(250, 0.006)
  }

  _respawn() {
    this.state = STATE.ROLLING
    this.chargeTime = 0
    this.sprite.body.setVelocityX(0)
    this.sprite.body.setVelocityY(0)
    this._targetX = this._baseX   // return to neutral X
    this.invincibleTimer = GAME_CONSTANTS.INVINCIBLE_TIME
    this.animator.forceReset()

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.3, to: 1 },
      duration: 120,
      repeat: 7,
      yoyo: true,
      onComplete: () => this.sprite.setAlpha(1)
    })
  }

  startGrind() {
    if (this.state === STATE.CRASHED || this.state === STATE.DEAD) return
    this.state = STATE.GRINDING
    this.grindTime = 0
    this.sprite.rotation = 0
    audio.playGrind()
    this.scene.events.emit('grind-start')
  }

  rampLaunch(boost = 1.0) {
    if (this.state === STATE.CRASHED || this.state === STATE.DEAD) return
    const power = GAME_CONSTANTS.JUMP_POWER_MIN * 0.85 * boost
    this.sprite.body.setVelocityY(power)
    this.state = STATE.AIRBORNE
    this.spinSpeed = 3 * boost
    this.scene.particles.spawnRampLaunchEffect(this.x, this.y)
    audio.playOllie(0.75)
    this.scene.events.emit('ramp-launch')
  }

  destroy() {
    this.sprite.destroy()
  }
}
