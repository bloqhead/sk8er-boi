import { LEVELS, OBSTACLES } from '../data/levels.js'
import { layout }            from './Layout.js'

const HITBOX_SCALE = 0.52   // fraction of visual sprite used for collision

export class ObstacleSystem {
  constructor(scene, levelId) {
    this.scene     = scene
    this.level     = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.obstacles = scene.physics.add.staticGroup()
    this.ramps     = scene.physics.add.staticGroup()
    this.rails     = scene.physics.add.staticGroup()
    this.pool      = []      // { sprite, glow, shadow }
    this.spawnTimer  = 0
    this.rampTimer   = 0
    this.railTimer   = 0
    this.nextSpawn   = 200

    const L = layout(scene)
    this.W = L.W
  }

  // Use terrain system if available, fallback to scene.groundY
  _groundYAt(screenX) {
    return this.scene.terrain?.groundYAtScreenX(screenX) ?? this.scene.groundY ?? (this.scene.scale.height - 60)
  }

  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    this.spawnTimer += dx
    this.rampTimer  += dx
    this.railTimer  += dx

    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0
      this.nextSpawn  = Phaser.Math.Between(170, 420)
      if (Math.random() < this.level.obstacleFrequency) this._spawnObstacle()
    }
    if (this.rampTimer >= 600) {
      this.rampTimer = 0
      if (Math.random() < this.level.rampFrequency) this._spawnRamp()
    }
    if (this.railTimer >= 800) {
      this.railTimer = 0
      if (Math.random() < this.level.railFrequency) this._spawnRail()
    }

    // Scroll all pooled objects
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const entry = this.pool[i]
      const { sprite, glow, shadow } = entry

      sprite.x -= dx
      if (sprite.body) sprite.body.reset(sprite.x, sprite.y)

      // Keep glow and shadow in lock-step with sprite
      if (glow)   { glow.x = sprite.x;   glow.y = sprite.y }
      if (shadow) { shadow.x = sprite.x; shadow.y = entry.shadowBaseY - (entry.spawnGY - sprite.y) }

      // Cull off left edge
      if (sprite.x < -120) {
        sprite.destroy()
        if (glow)   glow.destroy()
        if (shadow) shadow.destroy()
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
      : def.low
        ? gy - hPx / 2 - 4
        : gy - hPx / 2

    const sprite = this.scene.physics.add.staticImage(sx, y, key)
    sprite.setImmovable(true)
    sprite.obstacleType = type
    sprite.isRamp = false
    sprite.isRail = false

    // Tight centred hitbox
    const hbW = Math.max(6,  wPx * HITBOX_SCALE) | 0
    const hbH = Math.max(8,  hPx * HITBOX_SCALE) | 0
    sprite.body.setSize(hbW, hbH)
    sprite.body.setOffset((wPx - hbW) / 2, (hPx - hbH) / 2)

    // Shadow ellipse — sits on ground surface
    const shadow = this.scene.add.ellipse(sx, gy + 3, wPx * 0.8, 5, 0x000000, 0.5).setDepth(7)

    // Coloured outline glow
    const glowColor = this._glowColor(type)
    const glow = this.scene.add.graphics().setDepth(8)
    glow.lineStyle(2, glowColor, 0.9)
    glow.strokeRect(-wPx / 2 - 1, -hPx / 2 - 1, wPx + 2, hPx + 2)
    glow.x = sx
    glow.y = y

    this.obstacles.add(sprite)
    this.pool.push({ sprite, glow, shadow, spawnGY: gy, shadowBaseY: gy + 3 })
  }

  _spawnRamp() {
    const key = `ramp_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    const sx    = this._spawnX()
    const gy    = this._groundYAt(sx)
    const rampH = 22 * 3
    const y     = gy - rampH / 2 + 8

    const sprite = this.scene.physics.add.staticImage(sx, y, key)
    sprite.setImmovable(true)
    sprite.isRamp = true; sprite.isRail = false
    sprite.rampBoost = 0.8 + Math.random() * 0.5

    this.ramps.add(sprite)
    this.pool.push({ sprite, glow: null, shadow: null, spawnGY: gy, shadowBaseY: gy })
  }

  _spawnRail() {
    const key = `rail_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    const sx    = this._spawnX() + 30
    const gy    = this._groundYAt(sx)
    const railH = 10 * 3
    const y     = gy - railH - 18

    const sprite = this.scene.physics.add.staticImage(sx, y, key)
    sprite.setImmovable(true)
    sprite.isRail = true; sprite.isRamp = false

    this.rails.add(sprite)
    this.pool.push({ sprite, glow: null, shadow: null, spawnGY: gy, shadowBaseY: gy })
  }

  _glowColor(type) {
    const MAP = {
      trash_can: 0x88ff88, person_standing: 0xff8844, person_walking: 0xff8844,
      child: 0xffdd00, pigeon: 0xaaddff, curb: 0xffffff, stairs: 0xffffff,
      newspaper_box: 0x44aaff, dog: 0xff6644, mailbox: 0x44aaff,
      fire_hydrant: 0xff4444, lawn_gnome: 0xff4488, barrel: 0xff8800,
      pipe: 0x88ccff, worker: 0xffcc00, cone: 0xff6600,
      neon_sign: 0xff00ff, scooter: 0x00ffff, forklift_wheel: 0xaaaaaa,
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
    for (const { sprite, glow, shadow } of this.pool) {
      sprite.destroy()
      if (glow)   glow.destroy()
      if (shadow) shadow.destroy()
    }
    this.pool = []
  }
}
