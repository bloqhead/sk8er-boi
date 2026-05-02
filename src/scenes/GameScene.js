import { Player } from '../entities/Player.js'
import { BackgroundSystem } from '../systems/BackgroundSystem.js'
import { ObstacleSystem } from '../systems/ObstacleSystem.js'
import { ParticleSystem } from '../systems/ParticleSystem.js'
import { LEVELS, GAME_CONSTANTS } from '../data/levels.js'
import { audio } from '../audio/AudioManager.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.gameSpeed = 320
    this.targetSpeed = 320
    this.distanceTraveled = 0
    this.levelProgress = 0
    this.levelLength = 8000 // px before next level
    this._mobileJump = false
    this._mobileSlowDown = false
    this._mobileSpeedUp = false
    this._mobileTrick = false
  }

  init(data) {
    this.levelId = data.levelId || 1
    this.levelData = LEVELS.find(l => l.id === this.levelId) || LEVELS[0]
    this.gameSpeed = this.levelData.speed
    this.targetSpeed = this.levelData.speed
    this.distanceTraveled = 0
    this.levelProgress = 0
    this._gameOver = false
  }

  create() {
    const { width, height } = this.scale
    audio.resume()

    // Ground platform (physics) — extra-wide so there's never a gap as world scrolls
    this.groundY = height - 80
    this.ground = this.physics.add.staticGroup()
    const groundRect = this.add.rectangle(width / 2, this.groundY + 20, width * 20, 40, 0x000000, 0)
    this.physics.add.existing(groundRect, true)
    groundRect.body.setSize(width * 20, 40)
    this.groundRect = groundRect
    this.ground.add(groundRect)

    // Systems
    this.bg = new BackgroundSystem(this, this.levelId)
    this.particles = new ParticleSystem(this)
    this.obstacleSystem = new ObstacleSystem(this, this.levelId)

    // Player
    this.player = new Player(this, GAME_CONSTANTS.PLAYER_START_X, this.groundY - 60)

    // Ground collision
    this.physics.add.collider(this.player.sprite, this.ground)

    // Obstacle collisions
    this.physics.add.overlap(
      this.player.sprite,
      this.obstacleSystem.obstacles,
      this._onObstacleHit,
      null,
      this
    )

    // Ramp collisions
    this.physics.add.overlap(
      this.player.sprite,
      this.obstacleSystem.ramps,
      this._onRampHit,
      null,
      this
    )

    // Rail collisions
    this.physics.add.overlap(
      this.player.sprite,
      this.obstacleSystem.rails,
      this._onRailHit,
      null,
      this
    )

    // Events
    this.events.on('player-dead', this._onPlayerDead, this)
    this.events.on('crash', (lives) => {
      this.scene.get('HUDScene').events.emit('lives-update', lives)
    })
    this.events.on('score-update', (score) => {
      this.scene.get('HUDScene').events.emit('score-update', score)
    })
    this.events.on('trick', (name) => {
      this.scene.get('HUDScene').events.emit('trick', name)
    })

    // Mobile controls
    this._createMobileControls(width, height)

    // HUD update
    this.scene.get('HUDScene').events.emit('level-start', this.levelData)
    this.scene.get('HUDScene').events.emit('lives-update', GAME_CONSTANTS.LIVES)
    this.scene.get('HUDScene').events.emit('score-update', 0)

    // Start rolling sound
    audio.startRolling()

    // Resize
    this.scale.on('resize', this._onResize, this)
  }

  _createMobileControls(width, height) {
    // Show touch controls on mobile OR any narrow screen
    const showTouch = !this.sys.game.device.os.desktop || width < 900
    if (!showTouch) return

    const btnSize = Math.min(Math.max(width * 0.14, 52), 80)
    const margin = 20
    const S = 4

    const btnStyle = {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: S
    }

    const by = height - margin - btnSize / 2

    const makeBtn = (x, y, label, fillColor, onDown, onUp) => {
      const zone = this.add.circle(x, y, btnSize / 2 + 8, 0x000000, 0) // invisible hit zone
        .setScrollFactor(0).setDepth(99).setInteractive()
      const circle = this.add.circle(x, y, btnSize / 2, fillColor, 0.75)
        .setScrollFactor(0).setDepth(100)
      const ring = this.add.circle(x, y, btnSize / 2, 0x000000, 0)
        .setScrollFactor(0).setDepth(100)
      ring.setStrokeStyle(3, 0xffffff, 0.3)
      const txt = this.add.text(x, y, label, btnStyle)
        .setOrigin(0.5).setScrollFactor(0).setDepth(101)

      zone.on('pointerdown', (ptr) => {
        ptr.event.stopPropagation()
        circle.setAlpha(1)
        onDown()
        audio.resume()
      })
      zone.on('pointerup', () => { circle.setAlpha(0.75); onUp() })
      zone.on('pointerout', () => { circle.setAlpha(0.75); onUp() })
    }

    // Slow — bottom left
    makeBtn(margin + btnSize / 2, by, '◄', 0x3355dd,
      () => { this._mobileSlowDown = true },
      () => { this._mobileSlowDown = false })

    // Jump — bottom center (bigger)
    makeBtn(width / 2, by, '●', 0xdd1166,
      () => { this._mobileJump = true },
      () => { this._mobileJump = false })

    // Speed up — bottom right
    makeBtn(width - margin - btnSize / 2, by, '►', 0x3355dd,
      () => { this._mobileSpeedUp = true },
      () => { this._mobileSpeedUp = false })

    // Labels above buttons
    const labelStyle = { fontFamily: "'Press Start 2P'", fontSize: `${S * 1}px`, color: '#666666' }
    this.add.text(margin + btnSize / 2, by - btnSize / 2 - 12, 'SLOW', labelStyle)
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101)
    this.add.text(width / 2, by - btnSize / 2 - 12, 'OLLIE', labelStyle)
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101)
    this.add.text(width - margin - btnSize / 2, by - btnSize / 2 - 12, 'FAST', labelStyle)
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101)
  }

  _onObstacleHit(playerSprite, obstacle) {
    if (this.player.isInvincible || this.player.state === 'crashed') return
    this.player.crash()
    audio.playCrash()
  }

  _onRampHit(playerSprite, ramp) {
    if (this.player.state === 'crashed') return
    if (this.player.onGround) {
      this.player.rampLaunch(ramp.rampBoost || 1.0)
    }
  }

  _onRailHit(playerSprite, rail) {
    if (this.player.state === 'crashed' || this.player.state === 'airborne') return
    if (this.player.state !== 'grinding') {
      this.player.startGrind()
    }
  }

  _onPlayerDead() {
    if (this._gameOver) return
    this._gameOver = true
    audio.stopRolling()
    this.time.delayedCall(800, () => {
      this.scene.stop('HUDScene')
      this.scene.start('GameOverScene', {
        score: this.player.score,
        level: this.levelId,
        tricks: this.player.tricks,
        distance: Math.floor(this.distanceTraveled)
      })
    })
  }

  update(time, delta) {
    if (this._gameOver) return

    const dt = delta

    // Speed lerp
    this.gameSpeed = Phaser.Math.Linear(this.gameSpeed, this.targetSpeed, 0.05)

    // Distance tracking
    const dx = (this.gameSpeed / 1000) * dt
    this.distanceTraveled += dx
    this.levelProgress += dx

    // Score from distance
    const meterScore = Math.floor(dx * GAME_CONSTANTS.SCORE_PER_METER)
    if (meterScore > 0) {
      this.player.score += meterScore
      this.events.emit('score-update', this.player.score)
    }

    // Level transition
    if (this.levelProgress >= this.levelLength) {
      this.levelProgress = 0
      this._advanceLevel()
    }

    // Update systems
    this.bg.update(delta, this.gameSpeed)
    this.obstacleSystem.update(delta, this.gameSpeed, this.player.x)
    this.particles.update(delta)
    this.player.update(delta, this.gameSpeed)

    // (ground is static and wide enough — no reset needed)

    // HUD progress
    if (this.scene.get('HUDScene')) {
      this.scene.get('HUDScene').events.emit('distance', this.distanceTraveled)
      this.scene.get('HUDScene').events.emit('speed', this.gameSpeed)
      this.scene.get('HUDScene').events.emit('progress', this.levelProgress / this.levelLength)
      this.scene.get('HUDScene').events.emit('charge', this.player.chargePercent)
    }

    // Speed lines at high speed
    if (this.gameSpeed > 420) {
      this.particles.spawnSpeedLines(
        this.player.x + 50,
        this.player.y,
        (this.gameSpeed - 420) / 200
      )
    }
  }

  increaseSpeed() {
    this.targetSpeed = Math.min(this.levelData.maxSpeed, this.targetSpeed + GAME_CONSTANTS.SPEED_INCREMENT)
    audio.playSpeedUp()
  }

  reduceSpeed() {
    this.targetSpeed = Math.max(200, this.targetSpeed - GAME_CONSTANTS.SPEED_INCREMENT)
    audio.playSlowDown()
  }

  _advanceLevel() {
    const nextId = this.levelId + 1
    if (nextId > LEVELS.length) {
      // Completed all levels - win!
      this._gameOver = true
      audio.stopRolling()
      audio.playLevelUp()
      this.time.delayedCall(500, () => {
        this.scene.stop('HUDScene')
        this.scene.start('GameOverScene', {
          score: this.player.score,
          level: this.levelId,
          tricks: this.player.tricks,
          distance: Math.floor(this.distanceTraveled),
          won: true
        })
      })
      return
    }

    audio.playLevelUp()
    this.scene.stop('HUDScene')
    this.scene.start('LevelTransitionScene', {
      nextLevelId: nextId,
      score: this.player.score,
      tricks: this.player.tricks,
      distance: Math.floor(this.distanceTraveled)
    })
  }

  _onResize(gameSize) {
    const { width, height } = gameSize
    this.groundY = height - 80
  }

  shutdown() {
    audio.stopRolling()
    this.bg.destroy()
    this.particles.destroy()
    this.obstacleSystem.destroy()
    this.scale.off('resize', this._onResize, this)
  }
}
