import { LEVELS } from '../data/levels.js'
import { layout } from './Layout.js'

/**
 * Simplified background:
 * - Sky gradient (static canvas texture)
 * - Moon/sun (Phaser graphics, no animation)
 * - Far/mid/near silhouette strips — FLAT COLOR ONLY, no windows
 *   so obstacles pop clearly against a clean backdrop
 * - Animated life added via live Phaser objects (tweens, timers):
 *   stars twinkle, clouds drift, neon signs blink
 * - Ground fog strip to separate sky from street
 */
export class BackgroundSystem {
  constructor(scene, levelId) {
    this.scene   = scene
    this.level   = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.layers  = []   // { obj, speed, tile }
    this._anims  = []   // live objects to destroy on shutdown

    this._clearTextures()

    const L      = layout(scene)
    this.W       = L.W
    this.H       = L.H
    this.groundY = L.groundY

    this._create()
  }

  _clearTextures() {
    const id = this.level.id
    ;[`sky_${id}`, `bld_far_${id}`, `bld_mid_${id}`, `bld_near_${id}`].forEach(k => {
      if (this.scene.textures.exists(k)) this.scene.textures.remove(k)
    })
  }

  _create() {
    this._drawSky()
    this._addCelestial()
    this._buildingLayers()
    this._addAnimatedLife()
    this._groundFog()
  }

  // ─── Sky ─────────────────────────────────────────────────────────────
  _drawSky() {
    const { W, H, groundY } = this
    const colors = this.level.bgColors.sky
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')

    const grad = ctx.createLinearGradient(0, 0, 0, groundY + 20)
    grad.addColorStop(0,    '#' + colors[0].toString(16).padStart(6, '0'))
    grad.addColorStop(0.55, '#' + colors[1].toString(16).padStart(6, '0'))
    grad.addColorStop(1,    '#' + colors[2].toString(16).padStart(6, '0'))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Static stars baked into the sky texture for night levels
    if ([1, 3, 4].includes(this.level.id)) {
      for (let i = 0; i < 70; i++) {
        const bright = Math.random() > 0.5
        ctx.fillStyle = bright ? 'rgba(255,255,255,0.8)' : 'rgba(200,210,255,0.35)'
        ctx.fillRect(
          Math.random() * W | 0,
          (Math.random() * groundY * 0.8) | 0,
          Math.random() < 0.12 ? 2 : 1, 1
        )
      }
    }

    const key = 'sky_' + this.level.id
    this.scene.textures.addCanvas(key, c)
    const sky = this.scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(-10)
    this.layers.push({ obj: sky, speed: 0 })
  }

  // ─── Moon or Sun ─────────────────────────────────────────────────────
  _addCelestial() {
    const { W, H } = this
    const g  = this.scene.add.graphics().setScrollFactor(0).setDepth(-9)
    const mx = W * 0.80, my = H * 0.10
    const r  = Math.max(10, W * 0.025)

    if (this.level.id === 2) {
      // Bright sun with corona
      g.fillStyle(0xfff176, 1); g.fillCircle(mx, my, r)
      g.fillStyle(0xffee58, 0.3); g.fillCircle(mx, my, r * 1.5)
    } else {
      // Moon — slightly offset crescent shadow
      g.fillStyle(this.level.id === 4 ? 0xddeeff : 0xeeeedd, 0.95)
      g.fillCircle(mx, my, r)
      g.fillStyle(0x000000, 0.08)
      g.fillCircle(mx - r * 0.3, my - r * 0.2, r * 0.28)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  // ─── Building silhouette strips ───────────────────────────────────────
  // Flat color only — no window grids. Obstacles need to be the visual focus.
  _buildingLayers() {
    const { W, groundY } = this
    const lv = this.level
    this._silhouetteStrip('far',  W, groundY, lv, 0.08, -6, 0.10, 0.28)
    this._silhouetteStrip('mid',  W, groundY, lv, 0.25, -5, 0.20, 0.46)
    this._silhouetteStrip('near', W, groundY, lv, 0.50, -4, 0.28, 0.56)
  }

  _silhouetteStrip(name, W, groundY, lv, scrollFactor, depth, minHF, maxHF) {
    const totalW = W * 4
    const c = document.createElement('canvas')
    c.width = totalW; c.height = groundY + 2
    const ctx = c.getContext('2d')

    let x = 0
    while (x < totalW) {
      const bw = (W * 0.035 + Math.random() * W * 0.075) | 0
      const bh = (groundY * minHF + Math.random() * groundY * (maxHF - minHF)) | 0
      const baseColor = lv.buildingColors[Math.floor(Math.random() * lv.buildingColors.length)]

      // Lighten far layer for atmosphere / depth cue
      const lighten = name === 'far' ? 0.22 : name === 'mid' ? 0.10 : 0
      const r_ = Math.min(255, (((baseColor >> 16) & 0xff) * (1 + lighten)) | 0)
      const g_ = Math.min(255, (((baseColor >>  8) & 0xff) * (1 + lighten)) | 0)
      const b_ = Math.min(255, ((baseColor & 0xff) * (1 + lighten)) | 0)

      ctx.fillStyle = `rgb(${r_},${g_},${b_})`
      ctx.fillRect(x, groundY - bh, bw, bh)

      // Rooftop details for near layer only (adds silhouette variety)
      if (name === 'near' && bw > 20) {
        // Occasional antenna
        if (Math.random() < 0.3) {
          ctx.fillStyle = `rgb(${r_},${g_},${b_})`
          ctx.fillRect(x + (bw * 0.5) | 0, groundY - bh - (5 + Math.random() * 10) | 0, 2, 12)
        }
        // Occasional rooftop block (water tower / HVAC)
        if (Math.random() < 0.2) {
          const tw = 8 + Math.random() * 10 | 0
          const th = 6 + Math.random() * 8 | 0
          ctx.fillStyle = `rgb(${Math.max(0,r_-15)},${Math.max(0,g_-15)},${Math.max(0,b_-15)})`
          ctx.fillRect(x + (bw * 0.25) | 0, groundY - bh - th, tw, th)
        }
      }

      x += bw + (Math.random() * 5 + 2 | 0)
    }

    const key = `bld_${name}_${lv.id}`
    this.scene.textures.addCanvas(key, c)

    const ts = this.scene.add.tileSprite(0, 0, W, groundY + 2, key)
      .setOrigin(0, 0).setDepth(depth).setScrollFactor(0)
    this.layers.push({ obj: ts, speed: scrollFactor, tile: true })
  }

  // ─── Animated life ────────────────────────────────────────────────────
  // Added as live Phaser graphics so they run every frame independent of
  // the static canvas textures.
  _addAnimatedLife() {
    const { W, H, groundY } = this
    const lv = this.level

    if ([1, 3, 4].includes(lv.id)) {
      // Twinkling stars — 12 bright dots that pulse in/out with random timing
      for (let i = 0; i < 12; i++) {
        const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-8)
        const sx = Math.random() * W
        const sy = Math.random() * groundY * 0.75
        const bright = Math.random() > 0.4
        g.fillStyle(bright ? 0xffffff : 0xaabbff, 1)
        g.fillRect(sx | 0, sy | 0, bright ? 2 : 1, bright ? 2 : 1)
        this.scene.tweens.add({
          targets: g,
          alpha: { from: Math.random() * 0.4 + 0.1, to: 1 },
          duration: 800 + Math.random() * 1600,
          yoyo: true, repeat: -1,
          delay: Math.random() * 2000,
          ease: 'Sine.InOut',
        })
        this._anims.push(g)
      }
    }

    if (lv.id === 2) {
      // Drifting clouds — simple ellipses that slowly scroll left
      for (let i = 0; i < 3; i++) {
        const g    = this.scene.add.graphics().setScrollFactor(0).setDepth(-7)
        const cx   = W * (0.1 + Math.random() * 0.8)
        const cy   = groundY * (0.08 + Math.random() * 0.22)
        const rw   = W * (0.06 + Math.random() * 0.06)
        const rh   = rw * 0.38

        g.fillStyle(0xffffff, 0.45)
        g.fillEllipse(0, 0, rw * 2, rh * 2)
        g.fillEllipse(rw * 0.5, -rh * 0.3, rw * 1.3, rh * 1.3)
        g.fillEllipse(-rw * 0.4, -rh * 0.2, rw, rh * 1.1)
        g.x = cx; g.y = cy

        // Drift slowly left, wrap around when off-screen
        const speed = 8 + Math.random() * 12  // px/sec
        this.scene.time.addEvent({
          delay: 16,
          loop: true,
          callback: () => {
            if (!g.active) return
            g.x -= speed * 0.016
            if (g.x < -rw * 2) g.x = W + rw * 2
          }
        })
        this._anims.push(g)
      }
    }

    if (lv.id === 1 || lv.id === 4) {
      // Blinking neon signs — small coloured rectangles on near buildings
      const neonColors = [0xff00ff, 0x00ffff, 0xff2d78, 0xf5e642, 0x00ff88]
      for (let i = 0; i < 4; i++) {
        const g    = this.scene.add.graphics().setScrollFactor(0).setDepth(-3)
        const sx   = W * (0.1 + Math.random() * 0.75)
        const sy   = groundY * (0.3 + Math.random() * 0.35)
        const sw   = 14 + Math.random() * 20 | 0
        const color = neonColors[Math.floor(Math.random() * neonColors.length)]
        g.fillStyle(color, 1)
        g.fillRect(0, 0, sw, 4)
        // Second line of sign
        g.fillRect(0, 6, sw * 0.6, 3)
        g.x = sx; g.y = sy

        // Blink on/off like a real neon
        const blinkOn  = 900 + Math.random() * 600
        const blinkOff = 80  + Math.random() * 120
        const blink = () => {
          if (!g.active) return
          g.setAlpha(0)
          this.scene.time.delayedCall(blinkOff, () => {
            if (!g.active) return
            g.setAlpha(0.9)
            this.scene.time.delayedCall(blinkOn, blink)
          })
        }
        this.scene.time.delayedCall(Math.random() * 2000, blink)
        this._anims.push(g)
      }
    }

    if (lv.id === 3) {
      // Industrial: slow-rising smoke puffs from chimneys
      const chimneyXs = [W * 0.15, W * 0.45, W * 0.72]
      chimneyXs.forEach(cx => {
        const emit = () => {
          if (!this.scene.scene.isActive()) return
          const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-3)
          g.fillStyle(0x886655, 1)
          const r = 4 + Math.random() * 5
          g.fillCircle(0, 0, r)
          g.x = cx + (Math.random() - 0.5) * 8
          g.y = groundY * 0.38
          g.setAlpha(0.5)

          this.scene.tweens.add({
            targets: g,
            y: g.y - 40 - Math.random() * 30,
            x: g.x + (Math.random() - 0.5) * 20,
            alpha: 0,
            scaleX: 2.5, scaleY: 2.5,
            duration: 2200 + Math.random() * 1000,
            ease: 'Cubic.Out',
            onComplete: () => { g.destroy(); emit() }
          })
          this._anims.push(g)
        }
        this.scene.time.delayedCall(Math.random() * 1500, emit)
      })
    }
  }

  // ─── Ground fog ───────────────────────────────────────────────────────
  _groundFog() {
    const { W, groundY } = this
    const fogH = Math.max(18, groundY * 0.07)
    const g    = this.scene.add.graphics().setScrollFactor(0).setDepth(-2)
    for (let i = 0; i < fogH; i++) {
      g.fillStyle(0x000000, (i / fogH) * 0.5)
      g.fillRect(0, groundY - fogH + i, W, 1)
    }
    this.layers.push({ obj: g, speed: 0 })
  }

  // ─── Update ───────────────────────────────────────────────────────────
  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    for (const layer of this.layers) {
      if (layer.tile) layer.obj.tilePositionX += dx * layer.speed
    }
  }

  // ─── Destroy ─────────────────────────────────────────────────────────
  destroy() {
    for (const l of this.layers) l.obj.destroy()
    this.layers = []
    for (const a of this._anims) { try { a.destroy() } catch {} }
    this._anims = []
  }
}
