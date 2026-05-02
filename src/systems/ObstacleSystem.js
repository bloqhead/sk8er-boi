import { LEVELS, OBSTACLES } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'

export class ObstacleSystem {
  constructor(scene, levelId) {
    this.scene    = scene
    this.level    = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.obstacles= scene.physics.add.staticGroup()
    this.ramps    = scene.physics.add.staticGroup()
    this.rails    = scene.physics.add.staticGroup()
    this.pool     = []
    this.spawnTimer = 0
    this.rampTimer  = 0
    this.railTimer  = 0
    this.nextSpawn  = 180
    this.groundY    = GAME_H - 40
  }

  update(delta, gameSpeed, cameraX) {
    const dx = (gameSpeed / 1000) * delta
    this.spawnTimer += dx
    this.rampTimer  += dx
    this.railTimer  += dx

    // Obstacles
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0
      this.nextSpawn  = Phaser.Math.Between(160, 380)
      if (Math.random() < this.level.obstacleFrequency) this._spawnObstacle()
    }

    // Ramps
    if (this.rampTimer >= 500) {
      this.rampTimer = 0
      if (Math.random() < this.level.rampFrequency) this._spawnRamp()
    }

    // Rails
    if (this.railTimer >= 650) {
      this.railTimer = 0
      if (Math.random() < this.level.railFrequency) this._spawnRail()
    }

    // Scroll all objects left
    for (const obj of this.pool) {
      obj.x -= dx
      if (obj.body) obj.body.reset(obj.x, obj.y)
    }

    // Cull
    this.pool = this.pool.filter(obj => {
      if (obj.x < -80) { obj.destroy(); return false }
      return true
    })
  }

  _spawnX() { return GAME_W + 60 }

  _spawnObstacle() {
    const type    = this.level.obstacles[Math.floor(Math.random() * this.level.obstacles.length)]
    const def     = OBSTACLES[type]
    if (!def) return
    const texKey  = this._texKey(type)
    if (!this.scene.textures.exists(texKey)) return

    const y = def.flying
      ? this.groundY - 28 - Math.random() * 20
      : def.low
        ? this.groundY - (def.h * 3) / 2 - 8
        : this.groundY - (def.h * 3) / 2

    const obj = this.scene.physics.add.staticImage(this._spawnX(), y, texKey)
    obj.setImmovable(true)
    obj.obstacleType = type
    obj.isRamp = false; obj.isRail = false

    // Tighter hitbox for obstacles
    const bw = def.w * 3 - 4
    const bh = def.h * 3 - 4
    obj.body.setSize(bw, bh)

    this.obstacles.add(obj)
    this.pool.push(obj)
  }

  _spawnRamp() {
    const key = `ramp_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    // Ramp: 40w × 22h logical, × 3 = 120×66 canvas
    const rampH = 22 * 3
    const y = this.groundY - rampH / 2 + 10
    const obj = this.scene.physics.add.staticImage(this._spawnX(), y, key)
    obj.setImmovable(true)
    obj.isRamp = true; obj.isRail = false
    obj.rampBoost = 0.8 + Math.random() * 0.5
    this.ramps.add(obj)
    this.pool.push(obj)
  }

  _spawnRail() {
    const key = `rail_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    // Rail: 56w × 10h logical × 3 = 168×30
    const railH = 10 * 3
    const y = this.groundY - railH - 14
    const obj = this.scene.physics.add.staticImage(this._spawnX() + 30, y, key)
    obj.setImmovable(true)
    obj.isRail = true; obj.isRamp = false
    this.rails.add(obj)
    this.pool.push(obj)
  }

  _texKey(type) {
    const MAP = {
      trash_can:       'trash_can',
      pigeon:          'person_walking',
      person_standing: 'person_standing',
      person_walking:  'person_walking',
      child:           'child',
      curb:            'curb',
      stairs:          'stairs',
      newspaper_box:   'news_box',
      dog:             'dog',
      mailbox:         'mailbox',
      fire_hydrant:    'fire_hydrant',
      lawn_gnome:      'fire_hydrant',
      barrel:          'barrel',
      pipe:            'barrel',
      worker:          'person_standing',
      cone:            'cone',
      neon_sign:       'news_box',
      scooter:         'scooter',
      forklift_wheel:  'barrel',
    }
    return MAP[type] || 'trash_can'
  }

  destroy() {
    for (const obj of this.pool) obj.destroy()
    this.pool = []
  }
}
