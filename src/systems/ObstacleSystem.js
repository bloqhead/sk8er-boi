import { LEVELS, OBSTACLES } from '../data/levels.js'

export class ObstacleSystem {
  constructor(scene, levelId) {
    this.scene = scene
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.obstacles = scene.physics.add.staticGroup()
    this.ramps = scene.physics.add.staticGroup()
    this.rails = scene.physics.add.staticGroup()
    this.spawnTimer = 0
    this.rampTimer = 0
    this.railTimer = 0
    this.minGap = 280
    this.maxGap = 560
    this.nextSpawn = this.minGap
    this.distanceTraveled = 0
    this.activeObjects = []
  }

  get groundY() {
    return this.scene.scale.height - 80
  }

  update(delta, gameSpeed, cameraX) {
    const dx = (gameSpeed / 1000) * delta
    this.distanceTraveled += dx
    this.spawnTimer += dx
    this.rampTimer += dx
    this.railTimer += dx

    // Spawn obstacles
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0
      this.nextSpawn = Phaser.Math.Between(this.minGap, this.maxGap)
      if (Math.random() < this.level.obstacleFrequency) {
        this._spawnObstacle(cameraX)
      }
    }

    // Spawn ramps
    if (this.rampTimer >= 800) {
      this.rampTimer = 0
      if (Math.random() < this.level.rampFrequency) {
        this._spawnRamp(cameraX)
      }
    }

    // Spawn rails
    if (this.railTimer >= 1000) {
      this.railTimer = 0
      if (Math.random() < this.level.railFrequency) {
        this._spawnRail(cameraX)
      }
    }

    // Scroll all objects
    for (const obj of this.activeObjects) {
      obj.x -= dx
      if (obj.body) obj.body.reset(obj.x, obj.y)
    }

    // Cull off-screen
    this.activeObjects = this.activeObjects.filter(obj => {
      if (obj.x < cameraX - 300) {
        this._removeObject(obj)
        return false
      }
      return true
    })
  }

  _spawnObstacle(cameraX) {
    const spawnX = cameraX + this.scene.scale.width + 100
    const typeList = this.level.obstacles
    const type = typeList[Math.floor(Math.random() * typeList.length)]
    const def = OBSTACLES[type]
    if (!def) return

    const textureKey = this._getTextureKey(type)
    if (!this.scene.textures.exists(textureKey)) return

    const y = def.flying
      ? this.groundY - 60 - Math.random() * 40
      : def.low
        ? this.groundY - def.h / 2 - 20
        : this.groundY - def.h / 2

    const obj = this.scene.physics.add.staticImage(spawnX, y, textureKey)
    obj.setImmovable(true)
    obj.obstacleType = type
    obj.obstacleDef = def
    obj.isRamp = false
    obj.isRail = false
    obj.label = def.label

    // Adjust hitbox
    obj.body.setSize(def.w * 4 - 4, def.h * 4 - 4)

    this.obstacles.add(obj)
    this.activeObjects.push(obj)
  }

  _spawnRamp(cameraX) {
    const spawnX = cameraX + this.scene.scale.width + 150
    const key = `ramp_${this.level.id}`
    if (!this.scene.textures.exists(key)) return

    const rampW = 64
    const rampH = 40
    const y = this.groundY - rampH * 2

    const ramp = this.scene.physics.add.staticImage(spawnX, y, key)
    ramp.setImmovable(true)
    ramp.isRamp = true
    ramp.isRail = false
    ramp.rampBoost = 0.7 + Math.random() * 0.6

    this.ramps.add(ramp)
    this.activeObjects.push(ramp)
  }

  _spawnRail(cameraX) {
    const spawnX = cameraX + this.scene.scale.width + 200
    const key = `rail_${this.level.id}`
    if (!this.scene.textures.exists(key)) return

    const railW = 96
    const railH = 20
    const railY = this.groundY - railH * 2 - 8

    const rail = this.scene.physics.add.staticImage(spawnX, railY, key)
    rail.setImmovable(true)
    rail.isRail = true
    rail.isRamp = false
    rail.railLength = railW * 4

    this.rails.add(rail)
    this.activeObjects.push(rail)
  }

  _getTextureKey(type) {
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
      forklift_wheel:  'barrel'
    }
    return MAP[type] || 'trash_can'
  }

  _removeObject(obj) {
    obj.destroy()
  }

  destroy() {
    for (const obj of this.activeObjects) {
      obj.destroy()
    }
    this.activeObjects = []
  }
}
