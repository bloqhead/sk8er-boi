import { LEVELS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'

export class BackgroundSystem {
  constructor(scene, levelId) {
    this.scene = scene
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.layers = []
    this.groundY = GAME_H - 40   // ground surface Y in game coords
    this.create()
  }

  create() {
    this._drawSky()
    this._addMoonOrSun()
    this._createBuildingLayers()
    this._createGround()
  }

  _drawSky() {
    const lv = this.level
    const colors = lv.bgColors.sky
    const c = document.createElement('canvas')
    c.width = GAME_W; c.height = GAME_H
    const ctx = c.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_H * 0.7)
    grad.addColorStop(0,   `#${colors[0].toString(16).padStart(6,'0')}`)
    grad.addColorStop(0.6, `#${colors[1].toString(16).padStart(6,'0')}`)
    grad.addColorStop(1,   `#${colors[2].toString(16).padStart(6,'0')}`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, GAME_W, GAME_H)

    // Stars for dark levels
    if ([1, 3, 4].includes(this.level.id)) {
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * GAME_W
        const y = Math.random() * GAME_H * 0.65
        const bright = Math.random() > 0.6
        ctx.fillStyle = bright ? 'rgba(255,255,255,0.9)' : 'rgba(180,180,220,0.4)'
        const sz = Math.random() < 0.1 ? 2 : 1
        ctx.fillRect(Math.floor(x), Math.floor(y), sz, sz)
      }
    }

    if (!this.scene.textures.exists('sky_' + this.level.id)) {
      this.scene.textures.addCanvas('sky_' + this.level.id, c)
    }
    const sky = this.scene.add.image(0, 0, 'sky_' + this.level.id).setOrigin(0).setScrollFactor(0).setDepth(-10)
    this.layers.push({ obj: sky, speed: 0 })
  }

  _addMoonOrSun() {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-9)
    const mx = GAME_W * 0.78, my = GAME_H * 0.14, r = 10

    if (this.level.id === 2) {
      // Daytime sun
      g.fillStyle(0xffee88, 1)
      g.fillCircle(mx, my, r)
      g.fillStyle(0xffdd44, 0.5)
      g.fillCircle(mx, my, r + 4)
    } else {
      // Moon
      g.fillStyle(this.level.id === 4 ? 0xccccff : 0xeeeebb, 0.9)
      g.fillCircle(mx, my, r)
      // Craters
      g.fillStyle(0x000000, 0.08)
      g.fillCircle(mx - 3, my - 2, 3)
      g.fillCircle(mx + 2, my + 3, 2)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  _createBuildingLayers() {
    const lv = this.level
    const gY = this.groundY

    // Far layer — slowest parallax
    this._makeBuildingStrip('far', GAME_W, gY, lv.buildingColors, lv.windowColor, 0.12, -6,
      { minW: 15, maxW: 28, minH: gY * 0.20, maxH: gY * 0.38 })

    // Mid layer
    this._makeBuildingStrip('mid', GAME_W, gY, lv.buildingColors, lv.windowColor, 0.30, -5,
      { minW: 18, maxW: 32, minH: gY * 0.28, maxH: gY * 0.50 })

    // Near layer — fastest parallax, biggest buildings
    this._makeBuildingStrip('near', GAME_W, gY, lv.buildingColors, lv.windowColor, 0.55, -4,
      { minW: 20, maxW: 38, minH: gY * 0.35, maxH: gY * 0.60 })
  }

  _makeBuildingStrip(name, sceneW, groundY, colors, windowColor, scrollFactor, depth, sizes) {
    // Build a canvas wider than the screen to tile
    const totalW = sceneW * 4
    const c = document.createElement('canvas')
    c.width = totalW; c.height = groundY + 2
    const ctx = c.getContext('2d')

    let x = 0
    while (x < totalW) {
      const bw = sizes.minW + Math.floor(Math.random() * (sizes.maxW - sizes.minW))
      const bh = sizes.minH + Math.floor(Math.random() * (sizes.maxH - sizes.minH))
      const color = colors[Math.floor(Math.random() * colors.length)]
      const wc = `#${windowColor.toString(16).padStart(6, '0')}`

      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(x, groundY - bh, bw, bh)

      // Base shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(x, groundY - Math.min(bh, 4), bw, Math.min(bh, 4))

      // Windows
      for (let wy = groundY - bh + 3; wy < groundY - 1; wy += 5) {
        for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = Math.random() > 0.45 ? wc : 'rgba(0,0,0,0.35)'
            ctx.fillRect(wx, wy, 2, 3)
          }
        }
      }

      // Neon accent for city levels
      if ((this.level.id === 1 || this.level.id === 4) && Math.random() < 0.15) {
        const nc = [0xff00ff, 0x00ffff, 0xff2d78, 0xf5e642][Math.floor(Math.random() * 4)]
        ctx.fillStyle = `#${nc.toString(16).padStart(6, '0')}`
        ctx.globalAlpha = 0.7
        ctx.fillRect(x + 2, groundY - bh * 0.6, 8, 2)
        ctx.globalAlpha = 1
      }

      x += bw + Math.floor(Math.random() * 2 + 1)
    }

    const key = `bld_${name}_${this.level.id}`
    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, c)

    // tileSprite tiles the canvas automatically — perfect for endless scroll
    const ts = this.scene.add.tileSprite(0, 0, sceneW, groundY + 2, key)
      .setOrigin(0, 0).setDepth(depth).setScrollFactor(0)

    this.layers.push({ obj: ts, speed: scrollFactor, tile: true })
  }

  _createGround() {
    const lv = this.level
    const key = `ground_${lv.id}`

    // Build a short canvas that tiles horizontally
    const W = 96, H = 40
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')
    ctx.fillStyle = `#${lv.bgColors.ground[0].toString(16).padStart(6, '0')}`
    ctx.fillRect(0, 0, W, H)

    // Surface stripe
    ctx.fillStyle = `#${lv.bgColors.ground[1].toString(16).padStart(6, '0')}`
    ctx.fillRect(0, 0, W, 2)

    // Level-specific details
    if (lv.id === 1 || lv.id === 4) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      for (let x = 0; x < W; x += 14) ctx.fillRect(x, 8, 8, 1)
    } else if (lv.id === 2) {
      ctx.fillStyle = '#2d4a1e'
      ctx.fillRect(0, 0, W, 3)
    } else if (lv.id === 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      for (let x = 0; x < W; x += 3)
        for (let y = 0; y < H; y += 3)
          ctx.fillRect(x, y, 1, 1)
    }

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let x = 0; x < W; x += 12) ctx.fillRect(x, 0, 1, H)

    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, c)

    const ground = this.scene.add.tileSprite(0, this.groundY, GAME_W, H, key)
      .setOrigin(0, 0).setDepth(-3).setScrollFactor(0)

    this.groundSprite = ground
    this.layers.push({ obj: ground, speed: 1, tile: true })
  }

  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    for (const layer of this.layers) {
      if (layer.tile) layer.obj.tilePositionX += dx * layer.speed
    }
  }

  destroy() {
    for (const layer of this.layers) layer.obj.destroy()
    this.layers = []
  }
}
