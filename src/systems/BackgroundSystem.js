import { LEVELS } from '../data/levels.js'
import { layout } from './Layout.js'

export class BackgroundSystem {
  constructor(scene, levelId) {
    this.scene = scene
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.layers = []

    // Always destroy old textures for this level so color changes apply cleanly
    this._clearTextures()

    const L = layout(scene)
    this.W = L.W
    this.H = L.H
    this.groundY = L.groundY

    this._create()
  }

  _clearTextures() {
    const id = this.level.id
    const keys = [
      `sky_${id}`,
      `bld_far_${id}`, `bld_mid_${id}`, `bld_near_${id}`,
      `ground_${id}`,
    ]
    for (const k of keys) {
      if (this.scene.textures.exists(k)) this.scene.textures.remove(k)
    }
  }

  _create() {
    this._drawSky()
    this._addMoonOrSun()
    this._buildingLayers()
    this._groundFog()   // dark fog band just above the street — separates sky from ground
    this._ground()
  }

  _drawSky() {
    const { W, H, groundY } = this
    const colors = this.level.bgColors.sky
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')

    // Sky gradient fills from top to just past groundY
    const grad = ctx.createLinearGradient(0, 0, 0, groundY + 20)
    grad.addColorStop(0,   '#' + colors[0].toString(16).padStart(6, '0'))
    grad.addColorStop(0.55,'#' + colors[1].toString(16).padStart(6, '0'))
    grad.addColorStop(1,   '#' + colors[2].toString(16).padStart(6, '0'))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Stars for night levels
    if ([1, 3, 4].includes(this.level.id)) {
      for (let i = 0; i < 90; i++) {
        const bright = Math.random() > 0.55
        ctx.fillStyle = bright ? 'rgba(255,255,255,0.9)' : 'rgba(200,210,255,0.4)'
        const sz = Math.random() < 0.10 ? 2 : 1
        ctx.fillRect(Math.random() * W | 0, (Math.random() * groundY * 0.82) | 0, sz, sz)
      }
    }

    // Daytime (Suburbia) — add a few clouds
    if (this.level.id === 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      const drawCloud = (x, y, r) => {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(x+r*0.8, y+r*0.2, r*0.7, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(x-r*0.7, y+r*0.3, r*0.6, 0, Math.PI*2); ctx.fill()
      }
      drawCloud(W*0.15, groundY*0.2, W*0.04)
      drawCloud(W*0.55, groundY*0.12, W*0.035)
      drawCloud(W*0.80, groundY*0.28, W*0.03)
    }

    const key = 'sky_' + this.level.id
    this.scene.textures.addCanvas(key, c)
    const sky = this.scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(-10)
    this.layers.push({ obj: sky, speed: 0 })
  }

  _addMoonOrSun() {
    const { W, H } = this
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-9)
    const mx = W * 0.80, my = H * 0.10
    const r  = Math.max(10, W * 0.025)

    if (this.level.id === 2) {
      // Bright sun
      g.fillStyle(0xfff176, 1); g.fillCircle(mx, my, r)
      g.fillStyle(0xffee58, 0.35); g.fillCircle(mx, my, r * 1.45)
      g.fillStyle(0xffeb3b, 0.15); g.fillCircle(mx, my, r * 1.9)
    } else {
      // Moon
      g.fillStyle(this.level.id === 4 ? 0xddeeff : 0xeeeebb, 0.92)
      g.fillCircle(mx, my, r)
      // Craters
      g.fillStyle(0x000000, 0.07)
      g.fillCircle(mx - r*0.35, my - r*0.2, r*0.28)
      g.fillCircle(mx + r*0.25, my + r*0.32, r*0.2)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  _buildingLayers() {
    const { W, groundY } = this
    const lv = this.level
    // far: tallest, most distant, slowest, lightest shade
    this._strip('far',  W, groundY, lv, 0.08, -6, 0.12, 0.30)
    this._strip('mid',  W, groundY, lv, 0.25, -5, 0.22, 0.48)
    this._strip('near', W, groundY, lv, 0.50, -4, 0.30, 0.58)
  }

  _strip(name, W, groundY, lv, scrollFactor, depth, minHF, maxHF) {
    const totalW = W * 4
    const c = document.createElement('canvas')
    c.width = totalW; c.height = groundY + 2
    const ctx = c.getContext('2d')

    let x = 0
    while (x < totalW) {
      const bw = (W * 0.04 + Math.random() * W * 0.08) | 0
      const bh = (groundY * minHF + Math.random() * groundY * (maxHF - minHF)) | 0
      const color = lv.buildingColors[Math.floor(Math.random() * lv.buildingColors.length)]

      // Lighten far buildings more so they read as distant
      const lighten = name === 'far' ? 0.18 : name === 'mid' ? 0.08 : 0
      const r = Math.min(255, (((color >> 16) & 0xff) * (1 + lighten)) | 0)
      const g = Math.min(255, (((color >>  8) & 0xff) * (1 + lighten)) | 0)
      const b = Math.min(255, ((color & 0xff) * (1 + lighten)) | 0)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x, groundY - bh, bw, bh)

      // Base shadow — ground contact line
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(x, groundY - Math.min(bh, 6), bw, Math.min(bh, 6))

      // Windows
      const wc = '#' + lv.windowColor.toString(16).padStart(6, '0')
      const wSize = Math.max(2, (bw * 0.16) | 0)
      for (let wy = groundY - bh + wSize; wy < groundY - wSize; wy += wSize * 2.2) {
        for (let wx = x + wSize; wx < x + bw - wSize * 0.5; wx += wSize * 1.8) {
          const lit = Math.random() > 0.35
          ctx.fillStyle = lit ? wc : 'rgba(0,0,0,0.4)'
          if (lit) ctx.globalAlpha = 0.8 + Math.random() * 0.2
          ctx.fillRect(wx | 0, wy | 0, wSize, (wSize * 1.35) | 0)
          ctx.globalAlpha = 1
        }
      }

      // Neon sign accents on city/downtown near layer
      if (name === 'near' && (lv.id === 1 || lv.id === 4) && Math.random() < 0.20) {
        const nc = [0xff00ff, 0x00ffff, 0xff2d78, 0xf5e642, 0x00ff88][Math.floor(Math.random() * 5)]
        const nr = (nc >> 16) & 0xff
        const ng = (nc >> 8) & 0xff
        const nb = nc & 0xff
        ctx.fillStyle = `rgba(${nr},${ng},${nb},0.85)`
        const signW = (bw * 0.45) | 0
        ctx.fillRect(x + (Math.random() * (bw - signW)) | 0, (groundY - bh * 0.55) | 0, signW, 3)
      }

      x += bw + (Math.random() * 4 + 1 | 0)
    }

    const key = `bld_${name}_${lv.id}`
    this.scene.textures.addCanvas(key, c)

    const ts = this.scene.add.tileSprite(0, 0, W, groundY + 2, key)
      .setOrigin(0, 0).setDepth(depth).setScrollFactor(0)
    this.layers.push({ obj: ts, speed: scrollFactor, tile: true })
  }

  // Dark fog/haze band right above the ground — creates a clear visual break
  // between the background and the gameplay layer
  _groundFog() {
    const { W, groundY } = this
    const fogH = Math.max(20, groundY * 0.08)
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-2)

    // Gradient from transparent at top to dark at bottom
    for (let i = 0; i < fogH; i++) {
      const alpha = (i / fogH) * 0.55
      g.fillStyle(0x000000, alpha)
      g.fillRect(0, groundY - fogH + i, W, 1)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  _ground() {
    const { W, H, groundY } = this
    const lv  = this.level
    const key = 'ground_' + lv.id
    const gh  = Math.max(40, H - groundY)

    const c = document.createElement('canvas')
    c.width = 128; c.height = gh
    const ctx = c.getContext('2d')

    const gc = lv.bgColors.ground[0]
    ctx.fillStyle = '#' + gc.toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 128, gh)

    // Bright stripe right at the surface — makes the ground line crisp and readable
    const sc = lv.groundStripeColor || lv.bgColors.ground[1]
    ctx.fillStyle = '#' + sc.toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 128, 3)

    // Slightly lighter strip just below
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, 3, 128, 2)

    // Level-specific surface markings
    if (lv.id === 1) {
      // Asphalt road — white dashes
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      for (let x = 0; x < 128; x += 16) ctx.fillRect(x, gh * 0.35, 9, 2)
    } else if (lv.id === 2) {
      // Grass — small darker blades
      ctx.fillStyle = '#3a6828'
      for (let x = 2; x < 128; x += 5) ctx.fillRect(x, 0, 1, 4)
    } else if (lv.id === 3) {
      // Industrial metal grating
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      for (let x = 0; x < 128; x += 3)
        for (let y = 4; y < gh; y += 3)
          ctx.fillRect(x, y, 1, 1)
      ctx.fillStyle = 'rgba(255,150,0,0.06)'
      ctx.fillRect(0, 0, 128, gh)
    } else if (lv.id === 4) {
      // Neon city — glowing grid lines on road
      ctx.fillStyle = 'rgba(136,0,255,0.12)'
      for (let x = 0; x < 128; x += 12) ctx.fillRect(x, 0, 1, gh)
      for (let y = 0; y < gh; y += 8) ctx.fillRect(0, y, 128, 1)
    }

    // Vertical crack seams
    ctx.fillStyle = 'rgba(0,0,0,0.14)'
    for (let x = 0; x < 128; x += 14) ctx.fillRect(x, 0, 1, gh)

    this.scene.textures.addCanvas(key, c)
    const gs = this.scene.add.tileSprite(0, groundY, W, gh, key)
      .setOrigin(0, 0).setDepth(-3).setScrollFactor(0)
    this.layers.push({ obj: gs, speed: 1, tile: true })
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
