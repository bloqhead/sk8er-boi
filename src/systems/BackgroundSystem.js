import { LEVELS } from '../data/levels.js'

export class BackgroundSystem {
  constructor(scene, levelId) {
    this.scene = scene
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.layers = []
    this.buildingPool = []
    this.S = 4
    this.create()
  }

  create() {
    const { width, height } = this.scene.scale
    this._drawSky(width, height)
    this._createBuildingLayers(width, height)
    this._createGroundLayer(width, height)
  }

  _drawSky(width, height) {
    const lv = this.level
    const colors = lv.bgColors.sky

    // Gradient sky via multiple rects
    const c = document.createElement('canvas')
    c.width = width
    c.height = height * 0.65
    const ctx = c.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, c.height)
    grad.addColorStop(0, `#${colors[0].toString(16).padStart(6, '0')}`)
    grad.addColorStop(0.5, `#${colors[1].toString(16).padStart(6, '0')}`)
    grad.addColorStop(1, `#${colors[2].toString(16).padStart(6, '0')}`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, c.width, c.height)

    if (!this.scene.textures.exists('sky_bg')) {
      this.scene.textures.addCanvas('sky_bg', c)
    }

    const sky = this.scene.add.image(0, 0, 'sky_bg').setOrigin(0, 0)
    sky.setScrollFactor(0)
    sky.setDepth(-10)
    this.layers.push({ obj: sky, speed: 0 })

    // Stars for dark levels
    if ([3, 4].includes(this.level.id)) {
      this._addStars(width, height * 0.6)
    }

    // Moon
    this._addMoon(width, height)
  }

  _addStars(w, h) {
    const g = this.scene.add.graphics()
    g.setScrollFactor(0)
    g.setDepth(-9)
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * w
      const y = Math.random() * h * 0.8
      const size = Math.random() < 0.15 ? 2 : 1
      const bright = Math.random() > 0.6
      g.fillStyle(bright ? 0xffffff : 0x9999cc, Math.random() * 0.5 + 0.3)
      g.fillRect(Math.floor(x / this.S) * this.S, Math.floor(y / this.S) * this.S, size * this.S, size * this.S)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  _addMoon(w, h) {
    const g = this.scene.add.graphics()
    g.setScrollFactor(0.02)
    g.setDepth(-8)
    const mx = w * 0.75
    const my = h * 0.12
    const r = this.S * 10
    g.fillStyle(this.level.id === 1 ? 0xffdd44 : 0xeeeeff, 0.9)
    g.fillCircle(mx, my, r)
    // Craters
    g.fillStyle(0x00000000, 0)
    g.lineStyle(this.S, 0xddddcc, 0.3)
    g.strokeCircle(mx - r * 0.3, my - r * 0.2, r * 0.2)
    g.strokeCircle(mx + r * 0.2, my + r * 0.3, r * 0.15)
    this.layers.push({ obj: g, speed: 0.02 })
  }

  _createBuildingLayers(w, h) {
    const lv = this.level
    const groundY = h - 80

    // Layer 1: Far buildings (slowest)
    this._createBuildingStrip('bld_far', w, groundY, lv.buildingColors, 0.15, -6, 60, 80, groundY * 0.25, groundY * 0.4)

    // Layer 2: Mid buildings
    this._createBuildingStrip('bld_mid', w, groundY, lv.buildingColors, 0.35, -5, 48, 64, groundY * 0.3, groundY * 0.5)

    // Layer 3: Near buildings
    this._createBuildingStrip('bld_near', w, groundY, lv.buildingColors, 0.65, -4, 36, 48, groundY * 0.35, groundY * 0.55)
  }

  _createBuildingStrip(name, sceneW, groundY, colors, scrollFactor, depth, minW, maxW, minH, maxH) {
    const totalW = sceneW * 4
    const c = document.createElement('canvas')
    c.width = totalW
    c.height = groundY + 4
    const ctx = c.getContext('2d')

    let x = 0
    while (x < totalW) {
      const bw = minW + Math.floor(Math.random() * (maxW - minW))
      const bh = minH + Math.floor(Math.random() * (maxH - minH))
      const color = colors[Math.floor(Math.random() * colors.length)]
      const wc = this.level.windowColor

      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(x, groundY - bh, bw, bh)

      // Darker base
      ctx.fillStyle = `rgba(0,0,0,0.2)`
      ctx.fillRect(x, groundY - Math.min(bh, 8), bw, Math.min(bh, 8))

      // Windows
      const wcHex = `#${wc.toString(16).padStart(6, '0')}`
      for (let wy = groundY - bh + 6; wy < groundY - 4; wy += 10) {
        for (let wx = x + 4; wx < x + bw - 4; wx += 8) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = Math.random() > 0.4 ? wcHex : 'rgba(0,0,0,0.3)'
            ctx.fillRect(wx, wy, 4, 5)
          }
        }
      }

      // Rooftop water tower (rare)
      if (Math.random() < 0.08 && bw >= 36) {
        const tx = x + bw * 0.5
        const ty = groundY - bh - 12
        ctx.fillStyle = '#553300'
        ctx.fillRect(tx - 4, ty, 8, 12)
        ctx.fillStyle = '#774400'
        ctx.fillRect(tx - 5, ty, 10, 4)
      }

      // Neon sign for city levels
      if ((this.level.id === 4 || this.level.id === 1) && Math.random() < 0.12) {
        const sx = x + Math.random() * (bw - 16)
        const sy = groundY - bh * 0.6
        const neonColors = [0xff00ff, 0x00ffff, 0xff2d78, 0xf5e642]
        const nc = neonColors[Math.floor(Math.random() * neonColors.length)]
        ctx.fillStyle = `#${nc.toString(16).padStart(6, '0')}`
        ctx.globalAlpha = 0.8
        ctx.fillRect(sx, sy, 14, 3)
        ctx.fillRect(sx, sy + 5, 10, 3)
        ctx.globalAlpha = 1.0
      }

      x += bw + Math.floor(Math.random() * 4)
    }

    const key = `${name}_${this.level.id}`
    if (!this.scene.textures.exists(key)) {
      this.scene.textures.addCanvas(key, c)
    }

    const img = this.scene.add.tileSprite(0, 0, sceneW, groundY + 4, key)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0)

    this.layers.push({ obj: img, speed: scrollFactor, tileSprite: true })
  }

  _createGroundLayer(w, h) {
    const groundY = h - 80
    const lv = this.level
    const g1 = lv.bgColors.ground[0]
    const g2 = lv.bgColors.ground[1]

    const c = document.createElement('canvas')
    c.width = 128
    c.height = 80
    const ctx = c.getContext('2d')

    ctx.fillStyle = `#${g1.toString(16).padStart(6, '0')}`
    ctx.fillRect(0, 0, 128, 80)

    // Sidewalk / road markings
    if (lv.id === 1 || lv.id === 4) {
      ctx.fillStyle = `#${g2.toString(16).padStart(6, '0')}`
      ctx.fillRect(0, 20, 128, 8)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      for (let x = 0; x < 128; x += 24) {
        ctx.fillRect(x, 24, 14, 2)
      }
    }

    // Ground cracks
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    for (let i = 0; i < 5; i++) {
      const cx = Math.random() * 128
      const cy = Math.random() * 80
      ctx.fillRect(cx, cy, 3, 1)
    }

    const key = `ground_tile_${lv.id}`
    if (!this.scene.textures.exists(key)) {
      this.scene.textures.addCanvas(key, c)
    }

    this.ground = this.scene.add.tileSprite(0, groundY, w, 80, key)
      .setOrigin(0, 0)
      .setDepth(-3)
      .setScrollFactor(0)

    this.layers.push({ obj: this.ground, speed: 1, tileSprite: true })
  }

  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    for (const layer of this.layers) {
      if (layer.tileSprite && layer.obj.tilePositionX !== undefined) {
        layer.obj.tilePositionX += dx * layer.speed
      }
    }
  }

  destroy() {
    for (const layer of this.layers) {
      layer.obj.destroy()
    }
    this.layers = []
  }
}
