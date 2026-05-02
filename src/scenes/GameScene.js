import { Player } from '../entities/Player.js'
import { BackgroundSystem } from '../systems/BackgroundSystem.js'
import { ObstacleSystem } from '../systems/ObstacleSystem.js'
import { ParticleSystem } from '../systems/ParticleSystem.js'
import { LEVELS, GAME_CONSTANTS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'
import { audio } from '../audio/AudioManager.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.gameSpeed  = 260
    this.targetSpeed= 260
    this.distanceTraveled = 0
    this.levelProgress    = 0
    this.levelLength      = 6000
    this._mobileJump      = false
    this._mobileSlowDown  = false
    this._mobileSpeedUp   = false
    this._gameOver        = false
  }

  init(data) {
    this.levelId   = data.levelId || 1
    this.levelData = LEVELS.find(l => l.id === this.levelId) || LEVELS[0]
    this.gameSpeed = this.targetSpeed = this.levelData.speed
    this.distanceTraveled = 0
    this.levelProgress    = 0
    this._gameOver        = false
    this._mobileJump = this._mobileSlowDown = this._mobileSpeedUp = false
  }

  create() {
    audio.resume()

    // Ground Y in fixed game coords
    this.groundY = GAME_H - 40

    // Static ground body — wide enough that it never needs to move
    this.ground = this.physics.add.staticGroup()
    const gr = this.add.rectangle(GAME_W / 2, this.groundY + 4, GAME_W * 12, 10, 0x000000, 0)
    this.physics.add.existing(gr, true)
    gr.body.setSize(GAME_W * 12, 10)
    this.ground.add(gr)

    // Systems
    this.bg            = new BackgroundSystem(this, this.levelId)
    this.particles     = new ParticleSystem(this)
    this.obstacleSystem= new ObstacleSystem(this, this.levelId)

    // Player
    this.player = new Player(this, 80, this.groundY - 28)

    // Physics
    this.physics.add.collider(this.player.sprite, this.ground)
    this.physics.add.overlap(this.player.sprite, this.obstacleSystem.obstacles,
      this._onObstacleHit, null, this)
    this.physics.add.overlap(this.player.sprite, this.obstacleSystem.ramps,
      this._onRampHit, null, this)
    this.physics.add.overlap(this.player.sprite, this.obstacleSystem.rails,
      this._onRailHit, null, this)

    // Events
    this.events.on('player-dead', this._onPlayerDead, this)
    this.events.on('crash',        lives => this.scene.get('HUDScene')?.events.emit('lives-update', lives))
    this.events.on('score-update', score => this.scene.get('HUDScene')?.events.emit('score-update', score))
    this.events.on('trick',        name  => this.scene.get('HUDScene')?.events.emit('trick', name))

    // HUD init
    const hud = this.scene.get('HUDScene')
    if (hud) {
      hud.events.emit('level-start', this.levelData)
      hud.events.emit('lives-update', GAME_CONSTANTS.LIVES)
      hud.events.emit('score-update', 0)
    }

    // Mobile buttons
    this._createMobileControls()

    audio.startRolling()
  }

  _createMobileControls() {
    // Always show on narrow screens or mobile
    const showTouch = !this.sys.game.device.os.desktop || GAME_W < 500
    if (!showTouch) return

    // Buttons are in game-canvas coords (fixed 480×270)
    const btnR  = 18
    const pad   = 6
    const by    = GAME_H - btnR - pad

    const makeBtn = (x, label, icon, onDown, onUp) => {
      // Dark pill background
      const bg = this.add.circle(x, by, btnR, 0x000000, 0.55)
        .setScrollFactor(0).setDepth(200).setInteractive({ useHandCursor: true })
      const ring = this.add.circle(x, by, btnR, 0x000000, 0)
        .setScrollFactor(0).setDepth(200)
      ring.setStrokeStyle(1, 0xffffff, 0.25)

      // Material icon (HTML overlay via DOM — cleanest approach at fixed resolution)
      // We use Phaser text with the Material Symbols codepoints
      const txt = this.add.text(x, by, icon, {
        fontFamily: 'Material Symbols Rounded',
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

      // Small label below
      this.add.text(x, by + btnR + 3, label, {
        fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#888888'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201)

      bg.on('pointerdown', e => { e.stopPropagation(); onDown(); audio.resume(); bg.setAlpha(1) })
      bg.on('pointerup',   () => { onUp(); bg.setAlpha(0.55) })
      bg.on('pointerout',  () => { onUp(); bg.setAlpha(0.55) })
    }

    makeBtn(pad + btnR,           'SLOW', 'fast_rewind',
      () => { this._mobileSlowDown = true  },
      () => { this._mobileSlowDown = false })

    makeBtn(GAME_W / 2,           'OLLIE', 'keyboard_arrow_up',
      () => { this._mobileJump = true  },
      () => { this._mobileJump = false })

    makeBtn(GAME_W - pad - btnR,  'FAST', 'fast_forward',
      () => { this._mobileSpeedUp = true  },
      () => { this._mobileSpeedUp = false })
  }

  _onObstacleHit(playerSprite, obstacle) {
    if (this.player.isInvincible || this.player.state === 'crashed') return
    this.player.crash()
  }

  _onRampHit(playerSprite, ramp) {
    if (this.player.state === 'crashed') return
    if (this.player.onGround) this.player.rampLaunch(ramp.rampBoost || 1.0)
  }

  _onRailHit(playerSprite, rail) {
    if (this.player.state === 'crashed' || this.player.state === 'airborne') return
    if (this.player.state !== 'grinding') this.player.startGrind()
  }

  _onPlayerDead() {
    if (this._gameOver) return
    this._gameOver = true
    audio.stopRolling()
    this.time.delayedCall(600, () => {
      this.scene.stop('HUDScene')
      this.scene.start('GameOverScene', {
        score:    this.player.score,
        level:    this.levelId,
        tricks:   this.player.tricks,
        distance: Math.floor(this.distanceTraveled)
      })
    })
  }

  update(time, delta) {
    if (this._gameOver) return

    // Smooth speed
    this.gameSpeed = Phaser.Math.Linear(this.gameSpeed, this.targetSpeed, 0.04)

    const dx = (this.gameSpeed / 1000) * delta
    this.distanceTraveled += dx
    this.levelProgress    += dx

    // Score from skating distance
    const mpts = Math.floor(dx * GAME_CONSTANTS.SCORE_PER_METER)
    if (mpts > 0) {
      this.player.score += mpts
      this.events.emit('score-update', this.player.score)
    }

    // Level complete
    if (this.levelProgress >= this.levelLength) {
      this.levelProgress = 0
      this._advanceLevel()
    }

    this.bg.update(delta, this.gameSpeed)
    this.obstacleSystem.update(delta, this.gameSpeed, this.player.x)
    this.particles.update(delta)
    this.player.update(delta, this.gameSpeed)

    // HUD feeds
    const hud = this.scene.get('HUDScene')
    if (hud) {
      hud.events.emit('speed',    this.gameSpeed)
      hud.events.emit('progress', this.levelProgress / this.levelLength)
      hud.events.emit('charge',   this.player.chargePercent)
    }

    // Speed lines at high speed
    if (this.gameSpeed > 380) {
      this.particles.spawnSpeedLines(
        this.player.x + 40, this.player.y,
        (this.gameSpeed - 380) / 180
      )
    }
  }

  increaseSpeed() {
    this.targetSpeed = Math.min(this.levelData.maxSpeed, this.targetSpeed + GAME_CONSTANTS.SPEED_INCREMENT)
    audio.playSpeedUp()
  }

  reduceSpeed() {
    this.targetSpeed = Math.max(180, this.targetSpeed - GAME_CONSTANTS.SPEED_INCREMENT)
    audio.playSlowDown()
  }

  _advanceLevel() {
    const nextId = this.levelId + 1
    audio.playLevelUp()
    if (nextId > LEVELS.length) {
      this._gameOver = true
      audio.stopRolling()
      this.time.delayedCall(400, () => {
        this.scene.stop('HUDScene')
        this.scene.start('GameOverScene', {
          score: this.player.score, level: this.levelId,
          tricks: this.player.tricks, distance: Math.floor(this.distanceTraveled), won: true
        })
      })
      return
    }
    this.scene.stop('HUDScene')
    this.scene.start('LevelTransitionScene', {
      nextLevelId: nextId, score: this.player.score,
      tricks: this.player.tricks, distance: Math.floor(this.distanceTraveled)
    })
  }

  shutdown() {
    audio.stopRolling()
    if (this.bg)             this.bg.destroy()
    if (this.particles)      this.particles.destroy()
    if (this.obstacleSystem) this.obstacleSystem.destroy()
  }
}
