import { LEVELS, OBSTACLES } from '../data/levels.js'
import { layout }            from './Layout.js'

export class ObstacleSystem {
  constructor(scene, levelId) {
    this.scene     = scene
    this.level     = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.obstacles = scene.physics.add.staticGroup()
    this.ramps     = scene.physics.add.staticGroup()
    this.rails     = scene.physics.add.staticGroup()
    this.pool      = []
    this.spawnTimer  = 0
    this.rampTimer   = 0
    this.railTimer   = 0
    this.nextSpawn   = 200

    const L = layout(scene)
    this.groundY = L.groundY
    this.W = L.W
  }

  update(delta, gameSpeed, playerX) {
    const dx = (gameSpeed / 1000) * delta
    this.spawnTimer += dx
    this.rampTimer  += dx
    this.railTimer  += dx

    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0
      this.nextSpawn  = Phaser.Math.Between(170, 400)
      if (Math.random() < this.level.obstacleFrequency) this._spawnObstacle()
    }
    if (this.rampTimer >= 550) {
      this.rampTimer = 0
      if (Math.random() < this.level.rampFrequency) this._spawnRamp()
    }
    if (this.railTimer >= 720) {
      this.railTimer = 0
      if (Math.random() < this.level.railFrequency) this._spawnRail()
    }

    for (const obj of this.pool) {
      obj.x -= dx
      if (obj.body) obj.body.reset(obj.x, obj.y)
    }

    this.pool = this.pool.filter(obj => {
      if (obj.x < -100) { obj.destroy(); return false }
      return true
    })
  }

  _spawnX() { return this.W + 80 }

  _spawnObstacle() {
    const type   = this.level.obstacles[Math.floor(Math.random() * this.level.obstacles.length)]
    const def    = OBSTACLES[type]
    if (!def) return
    const key    = this._texKey(type)
    if (!this.scene.textures.exists(key)) return

    // Heights in logical pixels * S=3
    const hPx = def.h * 3
    const y   = def.flying
      ? this.groundY - hPx - 20 - Math.random() * 16
      : def.low
        ? this.groundY - hPx / 2 - 6
        : this.groundY - hPx / 2

    const obj = this.scene.physics.add.staticImage(this._spawnX(), y, key)
    obj.setImmovable(true)
    obj.obstacleType = type
    obj.isRamp = false; obj.isRail = false
    obj.body.setSize(def.w * 3 - 4, hPx - 4)

    this.obstacles.add(obj)
    this.pool.push(obj)
  }

  _spawnRamp() {
    const key = `ramp_${this.level.id}`
    if (!this.scene.textures.exists(key)) return
    const rampH = 22 * 3
    const y = this.groundY - rampH / 2 + 8
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
    const railH = 10 * 3
    const y = this.groundY - railH - 18
    const obj = this.scene.physics.add.staticImage(this._spawnX() + 30, y, key)
    obj.setImmovable(true)
    obj.isRail = true; obj.isRamp = false
    this.rails.add(obj)
    this.pool.push(obj)
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
    for (const obj of this.pool) obj.destroy()
    this.pool = []
  }
}
