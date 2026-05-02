import { GAME_CONSTANTS } from '../data/levels.js'
import { audio } from '../audio/AudioManager.js'

const STATE = {
  ROLLING: 'rolling',
  CHARGING: 'charging',
  AIRBORNE: 'airborne',
  GRINDING: 'grinding',
  CRASHED: 'crashed',
  DEAD: 'dead'
}

const TRICKS = ['KICKFLIP', 'HEELFLIP', '360 FLIP', 'VARIAL', 'HARDFLIP', 'SHOVE-IT', 'NOSEGRAB', 'TAILGRAB']

export class Player {
  constructor(scene, x, y) {
    this.scene = scene
    this.state = STATE.ROLLING
    this.chargeTime = 0
    this.invincibleTimer = 0
    this.lives = GAME_CONSTANTS.LIVES
    this.score = 0
    this.tricks = 0
    this.combo = 0
    this.grindTime = 0
    this.isGrinding = false
    this.airTime = 0
    this.rotationAngle = 0
    this.spinSpeed = 0
    this._trickDone = false
    this._landedGrind = false

    this._create(x, y)
    this._bindInput()
  }

  _create(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, 'skater_idle')
    this.sprite.setDepth(10)
    this.sprite.setScale(1)
    // Hitbox (smaller than sprite)
    this.sprite.body.setSize(40, 56)
    this.sprite.body.setOffset(18, 18)
    this.sprite.body.setMaxVelocityY(1200)
    this.sprite.body.setCollideWorldBounds(false)
    this.sprite.body.allowGravity = true
  }

  _bindInput() {
    const { keyboard } = this.scene.input
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    }
  }

  get x() { return this.sprite.x }
  get y() { return this.sprite.y }
  get body() { return this.sprite.body }
  get isDead() { return this.state === STATE.DEAD }
  get isInvincible() { return this.invincibleTimer > 0 }
  get chargePercent() { return Math.min(this.chargeTime / GAME_CONSTANTS.JUMP_CHARGE_TIME, 1) }
  get onGround() { return this.sprite.body.blocked.down }

  update(delta, gameSpeed) {
    if (this.state === STATE.DEAD) return

    const dt = delta
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt)

    // Mobile input from scene
    const jumpDown = this.keys.up.isDown || this.keys.space.isDown || this.scene._mobileJump
    const slowDown = this.keys.left.isDown || this.scene._mobileSlowDown
    const speedUp = this.keys.right.isDown || this.scene._mobileSpeedUp
    const shiftDown = this.keys.shift.isDown || this.scene._mobileTrick

    // Visual spin during air
    if (this.state === STATE.AIRBORNE) {
      this.airTime += dt
      this.rotationAngle += this.spinSpeed * (dt / 1000)
      this.sprite.rotation = this.rotationAngle

      // Random trick mid-air
      if (!this._trickDone && this.airTime > 200 && Math.random() < 0.003 * delta) {
        this._doMidAirTrick()
      }
    } else {
      this.rotationAngle = 0
      this.sprite.rotation = 0
      this.airTime = 0
      this._trickDone = false
    }

    switch (this.state) {
      case STATE.ROLLING:
        this._handleRolling(dt, jumpDown, slowDown, speedUp, shiftDown)
        break
      case STATE.CHARGING:
        this._handleCharging(dt, jumpDown, shiftDown)
        break
      case STATE.AIRBORNE:
        this._handleAirborne(dt)
        break
      case STATE.GRINDING:
        this._handleGrinding(dt, jumpDown)
        break
      case STATE.CRASHED:
        this._handleCrashed(dt)
        break
    }

    // Keep on screen vertically
    if (this.sprite.y > this.scene.scale.height + 100) {
      this.crash(true)
    }
  }

  _handleRolling(dt, jumpDown, slowDown, speedUp, shiftDown) {
    if (this.onGround) {
      this.scene.particles.spawnWheelSmoke(this.x - 20, this.y + 30)
    }

    if (jumpDown && this.onGround) {
      this.state = STATE.CHARGING
      this.chargeTime = 0
      this.sprite.setTexture('skater_charge')
      audio.resume()
    }

    if (slowDown) {
      this.scene.reduceSpeed()
    } else if (speedUp) {
      this.scene.increaseSpeed()
    }

    this._updateRollingTexture()
  }

  _handleCharging(dt, jumpDown, shiftDown) {
    this.chargeTime += dt

    // Release to jump
    if (!jumpDown) {
      this._launch()
      return
    }

    // Max charge auto-launch
    if (this.chargeTime >= GAME_CONSTANTS.JUMP_CHARGE_TIME * 1.5) {
      this._launch()
    }
  }

  _launch() {
    const pct = this.chargePercent
    const power = Phaser.Math.Linear(
      GAME_CONSTANTS.JUMP_POWER_MIN,
      GAME_CONSTANTS.JUMP_POWER_MAX,
      pct
    )
    this.sprite.body.setVelocityY(power)
    this.spinSpeed = pct * 4 + 1
    this.state = STATE.AIRBORNE
    this.sprite.setTexture('skater_ollie')
    this.scene.particles.spawnOllieParticles(this.x, this.y + 20, pct)
    audio.playOllie(pct)
    this.score += GAME_CONSTANTS.SCORE_OLLIE
    this.scene.events.emit('score-update', this.score)
    this.chargeTime = 0
  }

  _handleAirborne(dt) {
    if (this.onGround) {
      this._land()
    }
  }

  _land() {
    this.state = STATE.ROLLING
    this.sprite.setTexture('skater_idle')
    this.scene.particles.spawnLandParticles(this.x, this.y + 30)
    audio.playLand()

    if (this._landedGrind) {
      this._landedGrind = false
    }

    if (this._trickDone) {
      this.combo++
      const bonus = GAME_CONSTANTS.SCORE_TRICK * this.combo
      this.score += bonus
      this.scene.events.emit('score-update', this.score)
    } else {
      this.combo = Math.max(0, this.combo - 1)
    }
  }

  _doMidAirTrick() {
    if (this._trickDone) return
    this._trickDone = true
    this.tricks++
    const trickName = TRICKS[Math.floor(Math.random() * TRICKS.length)]
    this.scene.particles.spawnTrickEffect(this.x, this.y, trickName)
    audio.playScoreUp(this.combo + 1)
    this.score += GAME_CONSTANTS.SCORE_TRICK
    this.scene.events.emit('score-update', this.score)
    this.scene.events.emit('trick', trickName)
  }

  _handleGrinding(dt, jumpDown) {
    this.grindTime += dt
    this.isGrinding = true

    if (jumpDown && this.onGround) {
      // Jump off rail
      this.sprite.body.setVelocityY(-700)
      this.state = STATE.AIRBORNE
      this.sprite.setTexture('skater_ollie')
      this.spinSpeed = 3
      audio.playOllie(0.6)
      this.isGrinding = false
      return
    }

    if (!this.onGround) {
      this.state = STATE.AIRBORNE
      this.isGrinding = false
      return
    }

    const grindScore = Math.floor(this.grindTime / 100) * GAME_CONSTANTS.SCORE_RAIL
    this.score += grindScore
    this.grindTime = 0
    this.scene.particles.spawnGrindSparks(this.x, this.y + 25)
    audio.playGrind()
    this.scene.events.emit('score-update', this.score)
  }

  _handleCrashed(dt) {
    this.chargeTime += dt
    if (this.chargeTime > 1200) {
      if (this.lives > 0) {
        this._respawn()
      } else {
        this.state = STATE.DEAD
        this.scene.events.emit('player-dead')
      }
    }
  }

  _updateRollingTexture() {
    const t = this.scene.time.now
    const frame = Math.floor(t / 150) % 2
    this.sprite.setTexture(frame === 0 ? 'skater_idle' : 'skater_roll')
  }

  crash(instant = false) {
    if (this.isInvincible || this.state === STATE.CRASHED || this.state === STATE.DEAD) return

    this.lives--
    this.combo = 0
    this.state = STATE.CRASHED
    this.chargeTime = 0
    this.sprite.setTexture('skater_crash')
    this.sprite.body.setVelocityY(-300)
    this.sprite.body.setVelocityX(-200)
    this.scene.particles.spawnCrashParticles(this.x, this.y)
    audio.playCrash()
    this.scene.events.emit('crash', this.lives)
    this.scene.cameras.main.shake(300, 0.01)
    this.invincibleTimer = 0
  }

  _respawn() {
    this.state = STATE.ROLLING
    this.chargeTime = 0
    this.sprite.setTexture('skater_idle')
    this.sprite.body.setVelocityX(0)
    this.sprite.body.setVelocityY(0)
    this.invincibleTimer = GAME_CONSTANTS.INVINCIBLE_TIME
    this.sprite.setAlpha(0.5)

    // Blink effect
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.5, to: 1 },
      duration: 100,
      repeat: 6,
      yoyo: true,
      onComplete: () => this.sprite.setAlpha(1)
    })
  }

  startGrind() {
    if (this.state !== STATE.AIRBORNE && this.state !== STATE.ROLLING) return
    this.state = STATE.GRINDING
    this.grindTime = 0
    this.sprite.setTexture('skater_grind')
    audio.playGrind()
    this.scene.events.emit('grind-start')
  }

  rampLaunch(boost = 1.0) {
    if (this.state === STATE.CRASHED) return
    const power = GAME_CONSTANTS.JUMP_POWER_MIN * 0.8 * boost
    this.sprite.body.setVelocityY(power)
    this.state = STATE.AIRBORNE
    this.sprite.setTexture('skater_ollie')
    this.spinSpeed = 2.5 * boost
    this.scene.particles.spawnRampLaunchEffect(this.x, this.y)
    audio.playOllie(0.7)
    this.scene.events.emit('ramp-launch')
  }

  addScore(amount) {
    this.score += amount
    this.scene.events.emit('score-update', this.score)
  }

  destroy() {
    this.sprite.destroy()
  }
}
