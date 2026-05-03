import { LEVELS, OBSTACLES } from '../data/levels.js'
import { layout }            from './Layout.js'

const HITBOX_SCALE  = 0.52   // fraction of visual size for collision
const MIN_GAP_PX    = 320    // minimum world-pixels between obstacles (enforced)
const WARN_DIST     = 60     // pixels ahead of obstacle to show warning pip

export class ObstacleSystem {
  constructor(scene, levelId) {
    this.scene     = scene
    this.level     = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.obstacles = scene.physics.add.staticGroup()
    this.ramps     = scene.physics.add.staticGroup()
    this.rails     = scene.physics.add.staticGroup()
    this.pool      = []         // { sprite, pip, shadow, spawnGY, shadowBaseY }
    this.spawnTimer  = 0
    this.rampTimer   = 0
    this.railTimer   = 0
    this.nextSpawn   = 250      // world-px until next spawn attempt
    this._lastObstacleX = 9999 // tracks rightmost obstacle for gap enforcement

    const L = layout(scene)
    this.W = L.W
  }

  _groundYAt(screenX) {
    return this.scene.terrain?.groundYAtScreenX(screenX) ?? this.scene.groundY ?? (this.scene.scale.height - 60)
  }

  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    this.spawnTimer += dx
    this.rampTimer  += dx
    this.railTimer  += dx

    // Move lastObstacleX left with the world
    this._lastObstacleX -= dx

    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0
      this.nextSpawn  = Phaser.Math.Between(280, 480)

      // Only spawn if gap from previous obstacle is safe
      const rightEdge = this.W + 80
      const gap = rightEdge - this._lastObstacleX
      if (gap >= MIN_GAP_PX && Math.random() < this.level.obstacleFrequency) {
        this._spawnObstacle()
      }
    }
    if (this.rampTimer >= 700) {
      this.rampTimer = 0
      const gap = (this.W + 80) - this._lastObstacleX
      if (gap >= MIN_GAP_PX && Math.random() < this.level.rampFrequency) this._spawnRamp()
    }
    if (this.railTimer >= 900) {
      this.railTimer = 0
      const gap = (this.W + 80) - this._lastObstacleX
      if (gap >= MIN_GAP_PX && Math.random() < this.level.railFrequency) this._spawnRail()
    }

    // Scroll and cull
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const e = this.pool[i]
      e.sprite.x -= dx
      if (e.sprite.body) e.sprite.body.reset(e.sprite.x, e.sprite.y)
      if (e.shadow) { e.shadow.x = e.sprite.x; e.shadow.y = e.shadowBaseY - (e.spawnGY - e.sprite.y) }
      if (e.pip)    { e.pip.x    = e.sprite.x; e.pip.y    = e.sprite.y - e.pipOffY }

      if (e.sprite.x < -160) {
        e.sprite.destroy()
        if (e.shadow) e.shadow.destroy()
        if (e.pip)    e.pip.destroy()
        this.pool.splice(i, 1)
      }
    }
  }

  _spawnX() { return this.W + 80 }

  _spawnObstacle() {
    const type = this.level.obstacles[Math.floor(Math.random() * this.level.obstacles.length)]
    const def  = OBSTACLES[type]
    if (!def) return
    const key  = this._texKey(type)
    if (!this.scene.textures.exists(key)) return

    const S   = 3
    const wPx = def.w * S
    const hPx = def.h * S
    const sx  = this._spawnX()
    const gy  = this._groundYAt(sx)

    const y = def.flying
      ? gy - hPx - 18 - Math.random() * 14
      : def.low ? gy - hPx / 2 - 4 : gy - hPx / 2

    const sprite = this.scene.physics.add.staticImage(sx, y, key)
    sprite.setImmovable(true)
    sprite.obstacleType = type
    sprite.isRamp = false; sprite.isRail = false

    // Tight hitbox
    const hbW = Math.max(6, wPx * HITBOX_SCALE) | 0
    const hbH = Math.max(8, hPx * HITBOX_SCALE) | 0
    sprite.body.setSize(hbW, hbH)
    sprite.body.setOffset((wPx - hbW) / 2, (hPx - hbH) / 2)

    // Soft ground shadow (ellipse, no outline)
    const shadow = this.scene.add.ellipse(sx, gy + 3, wPx * 0.75, 4, 0x000000, 0.5).setDepth(7)

    // Warning pip — small colored diamond above obstacle (like SOR enemy indicator)
    const pip = this._makePip(sx, y, hPx, type)

    this.obstacles.add(sprite)
    this._lastObstacleX = sx
    this.pool.push({ sprite, shadow, pip, spawnGY: gy, shadowBaseY: gy + 3, pipOffY: hPx / 2 + 10 })
  }

  _makePip(x, y, hPx, type) {
    const color  = this._warningColor(type)
    const pipY   = y - hPx / 2 - 10
    const g      = this.scene.add.graphics().setDepth(15)
    const s      = 4  // half-size of diamond

    g.fillStyle(color, 1)
    // Diamond shape
    g.fillTriangle(x, pipY - s, x - s, pipY, x + s, pipY)
    g.fillTriangle(x, pipY + s, x - s, pipY, x + s, pipY)

    // Pulsing tween so it draws the eye
    this.scene.tweens.add({
      targets: g, alpha: { from: 1, to: 0.3 },
      duration: 380, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    return g
  }

  _spawnRamp() {
    const key = `ramp_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    const sx  = this._spawnX()
    const gy  = this._groundYAt(sx)
    const y   = gy - (22 * 3) / 2 + 8
    const sprite = this.scene.physics.add.staticImage(sx, y, key)
    sprite.setImmovable(true)
    sprite.isRamp = true; sprite.isRail = false
    sprite.rampBoost = 0.8 + Math.random() * 0.5
    this.ramps.add(sprite)
    this._lastObstacleX = sx
    this.pool.push({ sprite, shadow: null, pip: null, spawnGY: gy, shadowBaseY: gy, pipOffY: 0 })
  }

  _spawnRail() {
    const key = `rail_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    const sx  = this._spawnX() + 30
    const gy  = this._groundYAt(sx)
    const y   = gy - (10 * 3) - 18
    const sprite = this.scene.physics.add.staticImage(sx, y, key)
    sprite.setImmovable(true)
    sprite.isRail = true; sprite.isRamp = false
    this.rails.add(sprite)
    this._lastObstacleX = sx
    this.pool.push({ sprite, shadow: null, pip: null, spawnGY: gy, shadowBaseY: gy, pipOffY: 0 })
  }

  // Color of warning pip — vibrant, per obstacle type
  _warningColor(type) {
    const MAP = {
      trash_can: 0x00ff88, person_standing: 0xff6600, person_walking: 0xff6600,
      child: 0xffdd00, pigeon: 0x88ddff, curb: 0xffffff, stairs: 0xffffff,
      newspaper_box: 0x44aaff, dog: 0xff4422, mailbox: 0x44aaff,
      fire_hydrant: 0xff2222, lawn_gnome: 0xff44aa, barrel: 0xff8800,
      pipe: 0x88ccff, worker: 0xffcc00, cone: 0xff6600,
      neon_sign: 0xff00ff, scooter: 0x00ffff, forklift_wheel: 0xcccccc,
    }
    return MAP[type] ?? 0xffffff
  }

  _texKey(type) {
    const MAP = {
      trash_can: 'trash_can', pigeon: 'person_walking',
      person_standing: 'person_standing', person_walking: 'person_walking',
      child: 'child', curb: 'curb', stairs: 'stairs',
      newspaper_box: 'news_box', dog: 'dog', mailbox: 'mailbox',
      fire_hydrant: 'fire_hydrant', lawn_gnome: 'fire_hydrant',
      barrel: 'barrel', pipe: 'barrel', worker: 'person_standing',
      cone: 'cone', neon_sign: 'news_box', scooter: 'scooter',
      forklift_wheel: 'barrel',
    }
    return MAP[type] || 'trash_can'
  }

  destroy() {
    for (const { sprite, shadow, pip } of this.pool) {
      sprite.destroy()
      if (shadow) shadow.destroy()
      if (pip)    pip.destroy()
    }
    this.pool = []
  }
}
