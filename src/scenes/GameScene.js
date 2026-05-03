import { Player }           from '../entities/Player.js'
import { BackgroundSystem } from '../systems/BackgroundSystem.js'
import { ObstacleSystem }   from '../systems/ObstacleSystem.js'
import { ParticleSystem }   from '../systems/ParticleSystem.js'
import { TerrainSystem }    from '../systems/TerrainSystem.js'
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
    this._gameOver        = false
  }

  init(data) {
    this.levelId   = data.levelId || 1
    this.levelData = LEVELS.find(l => l.id === this.levelId) || LEVELS[0]
    this.gameSpeed = this.targetSpeed = this.levelData.speed
    this.distanceTraveled = 0
    this.levelProgress    = 0
    this._gameOver        = false
    // Reset DOM button flags
    window._sk8_slow = window._sk8_ollie = window._sk8_fast = false
  }

  create() {
    audio.resume()

    // Terrain first — provides groundY
    this.terrain = new TerrainSystem(this, this.levelId)
    this.groundY = this.terrain.currentY

    // Background
    this.bg = new BackgroundSystem(this, this.levelId)

    // Other systems
    this.particles      = new ParticleSystem(this)
    this.obstacleSystem = new ObstacleSystem(this, this.levelId)

    // Player
    this.player = new Player(this, 80, this.terrain.currentY - 30)

    // Physics
    this.physics.add.collider(this.player.sprite, this.terrain.segGroup)
    this.physics.add.overlap(this.player.sprite, this.obstacleSystem.obstacles, this._onObstacleHit, null, this)
    this.physics.add.overlap(this.player.sprite, this.obstacleSystem.ramps,     this._onRampHit,     null, this)
    this.physics.add.overlap(this.player.sprite, this.obstacleSystem.rails,     this._onRailHit,     null, this)

    // Events
    this.events.on('player-dead',  this._onPlayerDead, this)
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

    audio.startRolling()
    this.scale.on('resize', () => {
      this.scene.get('HUDScene')?.events.emit('resize')
    })
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
        score: this.player.score, level: this.levelId,
        tricks: this.player.tricks, distance: Math.floor(this.distanceTraveled),
      })
    })
  }

  update(time, delta) {
    if (this._gameOver) return

    this.gameSpeed = Phaser.Math.Linear(this.gameSpeed, this.targetSpeed, 0.04)
    const dx = (this.gameSpeed / 1000) * delta
    this.distanceTraveled += dx
    this.levelProgress    += dx

    const mpts = Math.floor(dx * GAME_CONSTANTS.SCORE_PER_METER)
    if (mpts > 0) {
      this.player.score += mpts
      this.events.emit('score-update', this.player.score)
    }

    if (this.levelProgress >= this.levelLength) {
      this.levelProgress = 0
      this._advanceLevel()
    }

    this.terrain.update(delta, this.gameSpeed)
    this.bg.update(delta, this.gameSpeed)
    this.obstacleSystem.update(delta, this.gameSpeed, this.player.x)
    this.particles.update(delta)
    this.player.update(delta, this.gameSpeed)

    // Tilt player on slope when grounded
    if (this.player.onGround && this.player.state !== 'crashed') {
      const slope = this.terrain.slopeAt(this.player.x)
      this.player.sprite.rotation = Phaser.Math.Linear(this.player.sprite.rotation, slope, 0.15)
    }

    // X floor
    const minX = Math.max(20, this.player._baseX - 55)
    if (this.player.sprite.x < minX) {
      this.player.sprite.x = minX
      if (this.player.sprite.body.velocity.x < 0) this.player.sprite.body.setVelocityX(0)
    }

    // Y ceiling
    if (this.player.sprite.y < 8) {
      this.player.sprite.y = 8
      this.player.sprite.body.setVelocityY(Math.max(0, this.player.sprite.body.velocity.y))
    }

    // HUD
    const hud = this.scene.get('HUDScene')
    if (hud) {
      hud.events.emit('speed',    this.gameSpeed)
      hud.events.emit('progress', this.levelProgress / this.levelLength)
      hud.events.emit('charge',   this.player.chargePercent)
    }

    if (this.gameSpeed > 340) {
      this.particles.spawnSpeedLines(this.player.x + 40, this.player.y, (this.gameSpeed - 340) / 160)
    }
  }

  increaseSpeed() {
    this.targetSpeed = Math.min(this.levelData.maxSpeed, this.targetSpeed + GAME_CONSTANTS.SPEED_INCREMENT)
    this.player.setSpeedPosition(this.targetSpeed, this.levelData.speed, this.levelData.maxSpeed)
    audio.playSpeedUp()
  }
  reduceSpeed() {
    this.targetSpeed = Math.max(160, this.targetSpeed - GAME_CONSTANTS.SPEED_INCREMENT)
    this.player.setSpeedPosition(this.targetSpeed, this.levelData.speed, this.levelData.maxSpeed)
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
    this.scale.off('resize')
    if (this.terrain)        this.terrain.destroy()
    if (this.bg)             this.bg.destroy()
    if (this.particles)      this.particles.destroy()
    if (this.obstacleSystem) this.obstacleSystem.destroy()
  }
}
