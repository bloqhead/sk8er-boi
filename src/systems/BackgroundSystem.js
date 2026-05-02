import { LEVELS } from '../data/levels.js'
import { layout } from './Layout.js'

export class BackgroundSystem {
  constructor(scene, levelId) {
    this.scene = scene
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.layers = []

    const L = layout(scene)
    this.W = L.W
    this.H = L.H
    this.groundY = L.groundY

    this._create()
  }

  _create() {
    this._drawSky()
    this._addMoonOrSun()
    this._buildingLayers()
    this._ground()
  }

  _drawSky() {
    const { W, H, groundY } = this
    const colors = this.level.bgColors.sky
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, groundY)
    grad.addColorStop(0,   '#' + colors[0].toString(16).padStart(6, '0'))
    grad.addColorStop(0.6, '#' + colors[1].toString(16).padStart(6, '0'))
    grad.addColorStop(1,   '#' + colors[2].toString(16).padStart(6, '0'))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    if ([1, 3, 4].includes(this.level.id)) {
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = Math.random() > 0.6
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(180,180,220,0.4)'
        const sz = Math.random() < 0.12 ? 2 : 1
        ctx.fillRect(Math.random() * W | 0, (Math.random() * groundY * 0.85) | 0, sz, sz)
      }
    }

    const key = 'sky_' + this.level.id
    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, c)
    const sky = this.scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(-10)
    this.layers.push({ obj: sky, speed: 0 })
  }

  _addMoonOrSun() {
    const { W, H } = this
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-9)
    const mx = W * 0.80, my = H * 0.10
    const r  = Math.max(8, W * 0.022)

    if (this.level.id === 2) {
      g.fillStyle(0xffee88, 1); g.fillCircle(mx, my, r)
      g.fillStyle(0xffdd44, 0.4); g.fillCircle(mx, my, r + r * 0.4)
    } else {
      g.fillStyle(this.level.id === 4 ? 0xccccff : 0xeeeebb, 0.9)
      g.fillCircle(mx, my, r)
      g.fillStyle(0x000000, 0.07)
      g.fillCircle(mx - r * 0.3, my - r * 0.2, r * 0.3)
      g.fillCircle(mx + r * 0.2, my + r * 0.3, r * 0.2)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  _buildingLayers() {
    const { W, groundY } = this
    const lv = this.level
    this._strip('far',   W, groundY, lv, 0.10, -6, 0.15, 0.32)
    this._strip('mid',   W, groundY, lv, 0.28, -5, 0.24, 0.48)
    this._strip('near',  W, groundY, lv, 0.52, -4, 0.32, 0.60)
  }

  _strip(name, W, groundY, lv, scrollFactor, depth, minHF, maxHF) {
    const totalW = W * 4
    const c = document.createElement('canvas')
    c.width = totalW; c.height = groundY + 2
    const ctx = c.getContext('2d')

    let x = 0
    while (x < totalW) {
      const bw = (W * 0.04 + Math.random() * W * 0.07) | 0
      const bh = (groundY * minHF + Math.random() * groundY * (maxHF - minHF)) | 0
      const color = lv.buildingColors[Math.floor(Math.random() * lv.buildingColors.length)]
      const wc = '#' + lv.windowColor.toString(16).padStart(6, '0')

      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
      ctx.fillRect(x, groundY - bh, bw, bh)

      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(x, groundY - Math.min(bh, 5), bw, Math.min(bh, 5))

      const wSize = Math.max(2, (bw * 0.18) | 0)
      for (let wy = groundY - bh + wSize; wy < groundY - wSize; wy += wSize * 2) {
        for (let wx = x + wSize; wx < x + bw - wSize; wx += wSize * 1.8) {
          ctx.fillStyle = Math.random() > 0.38 ? wc : 'rgba(0,0,0,0.35)'
          ctx.fillRect(wx | 0, wy | 0, wSize, (wSize * 1.4) | 0)
        }
      }

      if ((this.level.id === 1 || this.level.id === 4) && Math.random() < 0.14) {
        const nc = [0xff00ff, 0x00ffff, 0xff2d78, 0xf5e642][Math.floor(Math.random() * 4)]
        ctx.fillStyle = '#' + nc.toString(16).padStart(6, '0')
        ctx.globalAlpha = 0.7
        ctx.fillRect(x + 2, groundY - bh * 0.6, bw * 0.5, 2)
        ctx.globalAlpha = 1
      }

      x += bw + (Math.random() * 3 + 1 | 0)
    }

    const key = `bld_${name}_${lv.id}`
    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, c)

    const ts = this.scene.add.tileSprite(0, 0, W, groundY + 2, key)
      .setOrigin(0, 0).setDepth(depth).setScrollFactor(0)
    this.layers.push({ obj: ts, speed: scrollFactor, tile: true })
  }

  _ground() {
    const { W, H, groundY } = this
    const lv  = this.level
    const key = 'ground_' + lv.id
    const gh  = H - groundY

    const c = document.createElement('canvas')
    c.width = 128; c.height = gh
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#' + lv.bgColors.ground[0].toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 128, gh)
    ctx.fillStyle = '#' + lv.bgColors.ground[1].toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 128, 2)

    if (lv.id === 1 || lv.id === 4) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      for (let x = 0; x < 128; x += 14) ctx.fillRect(x, gh * 0.3, 8, 1)
    } else if (lv.id === 2) {
      ctx.fillStyle = '#2d4a1e'; ctx.fillRect(0, 0, 128, 3)
    } else if (lv.id === 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      for (let x = 0; x < 128; x += 3)
        for (let y = 0; y < gh; y += 3)
          ctx.fillRect(x, y, 1, 1)
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let x = 0; x < 128; x += 12) ctx.fillRect(x, 0, 1, gh)

    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, c)

    const g = this.scene.add.tileSprite(0, groundY, W, gh, key)
      .setOrigin(0, 0).setDepth(-3).setScrollFactor(0)
    this.layers.push({ obj: g, speed: 1, tile: true })
  }

  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    for (const layer of this.layers) {
      if (layer.tile) layer.obj.tilePositionX += dx * layer.speed
    }
  }

  destroy() {
    for (const l of this.layers) l.obj.destroy()
    this.layers = []
  }
}
