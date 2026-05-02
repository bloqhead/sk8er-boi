import { Player }           from '../entities/Player.js'
import { BackgroundSystem } from '../systems/BackgroundSystem.js'
import { ObstacleSystem }   from '../systems/ObstacleSystem.js'
import { ParticleSystem }   from '../systems/ParticleSystem.js'
import { LEVELS, GAME_CONSTANTS } from '../data/levels.js'
import { layout }           from '../systems/Layout.js'
import { audio }            from '../audio/AudioManager.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.gameSpeed   = 220
    this.targetSpeed = 220
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
    const L = layout(this)
    this._L = L

    // Ground Y: above touch button area on mobile, near bottom otherwise
    this.groundY = L.groundY

    // Wide invisible ground platform
    this._groundRect = this.add.rectangle(
      this.scale.width / 2,
      this.groundY + 6,
      this.scale.width * 20, 12,
      0x000000, 0,
    )
    this.physics.add.existing(this._groundRect, true)
    this._groundRect.body.setSize(this.scale.width * 20, 12)
    this.ground = this.physics.add.staticGroup()
    this.ground.add(this._groundRect)

    // Systems
    this.bg             = new BackgroundSystem(this, this.levelId)
    this.particles      = new ParticleSystem(this)
    this.obstacleSystem = new ObstacleSystem(this, this.levelId)

    // Player — starts 80px in, at ground
    this.player = new Player(this, 80, this.groundY - 30)
    this.playerMinX = 40   // never let player drift past this

    // Physics linkages
    this.physics.add.collider(this.player.sprite, this.ground)
    this.physics.add.overlap(
      this.player.sprite, this.obstacleSystem.obstacles,
      this._onObstacleHit, null, this,
    )
    this.physics.add.overlap(
      this.player.sprite, this.obstacleSystem.ramps,
      this._onRampHit, null, this,
    )
    this.physics.add.overlap(
      this.player.sprite, this.obstacleSystem.rails,
      this._onRailHit, null, this,
    )

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

    this._createTouchControls(L)
    audio.startRolling()

    // Rebuild on resize
    this.scale.on('resize', (sz) => this._onResize(sz))
  }

  _onResize(sz) {
    const L = layout(this)
    this._L = L
    this.groundY = L.groundY

    // Reposition ground body
    if (this._groundRect?.body) {
      this._groundRect.y = this.groundY + 6
      this._groundRect.body.reset(sz.width / 2, this.groundY + 6)
    }

    // Rebuild touch controls
    if (this._touchContainer) this._touchContainer.destroy()
    this._createTouchControls(L)

    // Tell HUD to reposition
    this.scene.get('HUDScene')?.events.emit('resize', L)
  }

  _createTouchControls(L) {
    const { W, H, btnR, btnPad, font, isPortrait } = L

    // Show on mobile or narrow windows
    const showTouch = !this.sys.game.device.os.desktop || W < 700

    this._touchContainer = this.add.container(0, 0).setDepth(200)

    if (!showTouch) return

    const cy = H - btnPad - btnR  // button centre Y

    const makeBtn = (cx, icon, label, colorHex, onDown, onUp) => {
      const bg = this.add.circle(cx, cy, btnR, colorHex, 0.55)
        .setScrollFactor(0).setDepth(200)
      const ring = this.add.circle(cx, cy, btnR, 0x000000, 0)
        .setScrollFactor(0).setDepth(200)
      ring.setStrokeStyle(1.5, 0xffffff, 0.2)

      // Icon
      const iconTxt = this.add.text(cx, cy, icon, {
        fontFamily: 'Material Symbols Rounded',
        fontSize:   Math.max(18, btnR * 0.9) + 'px',
        color:      '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

      // Small label below button
      this.add.text(cx, cy + btnR + 4, label, {
        fontFamily: "'Press Start 2P'",
        fontSize:   Math.max(4, font.xs - 1) + 'px',
        color:      '#666688',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201)

      // Big invisible zone for easy tapping
      const hitZone = this.add.circle(cx, cy, btnR + 10, 0x000000, 0)
        .setScrollFactor(0).setDepth(202).setInteractive()

      hitZone.on('pointerdown', e => {
        e.stopPropagation()
        onDown()
        audio.resume()
        bg.setAlpha(0.9)
        bg.setScale(1.1)
      })
      hitZone.on('pointerup',  () => { onUp(); bg.setAlpha(0.55); bg.setScale(1) })
      hitZone.on('pointerout', () => { onUp(); bg.setAlpha(0.55); bg.setScale(1) })

      this._touchContainer.add([bg, ring, iconTxt, hitZone])
    }

    const leftX  = btnPad + btnR
    const rightX = W - btnPad - btnR
    const midX   = W / 2

    makeBtn(leftX,  'fast_rewind',       'SLOW',  0x2244cc, () => { this._mobileSlowDown = true  }, () => { this._mobileSlowDown = false })
    makeBtn(midX,   'keyboard_arrow_up', 'OLLIE', 0xcc1155, () => { this._mobileJump = true  },     () => { this._mobileJump = false })
    makeBtn(rightX, 'fast_forward',      'FAST',  0x2244cc, () => { this._mobileSpeedUp = true  },  () => { this._mobileSpeedUp = false })
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
        distance: Math.floor(this.distanceTraveled),
      })
    })
  }

  update(time, delta) {
    if (this._gameOver) return

    this.gameSpeed = Phaser.Math.Linear(this.gameSpeed, this.targetSpeed, 0.04)

    const dx = (this.gameSpeed / 1000) * delta
    this.distanceTraveled += dx
    this.levelProgress    += dx

    // Distance score
    const mpts = Math.floor(dx * GAME_CONSTANTS.SCORE_PER_METER)
    if (mpts > 0) {
      this.player.score += mpts
      this.events.emit('score-update', this.player.score)
    }

    // Level advance
    if (this.levelProgress >= this.levelLength) {
      this.levelProgress = 0
      this._advanceLevel()
    }

    this.bg.update(delta, this.gameSpeed)
    this.obstacleSystem.update(delta, this.gameSpeed, this.player.x)
    this.particles.update(delta)
    this.player.update(delta, this.gameSpeed)

    // ── Player X floor — never let them disappear off left edge ───────
    if (this.player.sprite.x < this.playerMinX) {
      this.player.sprite.x = this.playerMinX
      if (this.player.sprite.body.velocity.x < 0) {
        this.player.sprite.body.setVelocityX(0)
      }
    }

    // ── Player Y ceiling — don't fly past top ─────────────────────────
    if (this.player.sprite.y < 10) {
      this.player.sprite.y = 10
      this.player.sprite.body.setVelocityY(Math.max(0, this.player.sprite.body.velocity.y))
    }

    // HUD feeds
    const hud = this.scene.get('HUDScene')
    if (hud) {
      hud.events.emit('speed',    this.gameSpeed)
      hud.events.emit('progress', this.levelProgress / this.levelLength)
      hud.events.emit('charge',   this.player.chargePercent)
    }

    // Speed lines
    if (this.gameSpeed > 340) {
      this.particles.spawnSpeedLines(
        this.player.x + 40, this.player.y,
        (this.gameSpeed - 340) / 160,
      )
    }
  }

  increaseSpeed() {
    this.targetSpeed = Math.min(this.levelData.maxSpeed, this.targetSpeed + GAME_CONSTANTS.SPEED_INCREMENT)
    audio.playSpeedUp()
  }
  reduceSpeed() {
    this.targetSpeed = Math.max(160, this.targetSpeed - GAME_CONSTANTS.SPEED_INCREMENT)
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
          tricks: this.player.tricks, distance: Math.floor(this.distanceTraveled), won: true,
        })
      })
      return
    }
    this.scene.stop('HUDScene')
    this.scene.start('LevelTransitionScene', {
      nextLevelId: nextId, score: this.player.score,
      tricks: this.player.tricks, distance: Math.floor(this.distanceTraveled),
    })
  }

  shutdown() {
    audio.stopRolling()
    this.scale.off('resize', this._onResize, this)
    if (this.bg)             this.bg.destroy()
    if (this.particles)      this.particles.destroy()
    if (this.obstacleSystem) this.obstacleSystem.destroy()
  }
}
