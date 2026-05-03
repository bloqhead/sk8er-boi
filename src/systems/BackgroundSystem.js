import { LEVELS } from '../data/levels.js'
import { layout  } from './Layout.js'

/**
 * BackgroundSystem — three-layer parallax city with proper building detail.
 *
 * Key design decisions:
 * - Neon signs, windows, and rooftop details are drawn INSIDE the building
 *   canvas at exact building positions (never floating free in sky)
 * - Building heights are capped so near buildings never fill more than
 *   ~45% of the screen — sky stays visible, obstacles have room to read
 * - Color palettes revised per level for contrast and atmosphere
 * - Animated life (tweens/timers) anchored to buildings via recorded positions
 */
export class BackgroundSystem {
  constructor(scene, levelId) {
    this.scene  = scene
    this.level  = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.layers = []
    this._live  = []   // live Phaser objects for animated elements

    this._clearTextures()

    const L      = layout(scene)
    this.W       = L.W
    this.H       = L.H
    this.groundY = L.groundY

    this._create()
  }

  _clearTextures() {
    const id = this.level.id
    ;['sky', 'bld_far', 'bld_mid', 'bld_near'].forEach(k => {
      const key = `${k}_${id}`
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key)
    })
  }

  _create() {
    this._sky()
    this._celestial()
    this._buildings()
    this._groundFog()
  }

  // ── Sky gradient ────────────────────────────────────────────────────
  _sky() {
    const { W, H, groundY } = this
    const [c0, c1, c2] = this.level.bgColors.sky
    const cvs = document.createElement('canvas')
    cvs.width = W; cvs.height = H
    const ctx = cvs.getContext('2d')

    const grad = ctx.createLinearGradient(0, 0, 0, groundY + 20)
    grad.addColorStop(0,    '#' + c0.toString(16).padStart(6,'0'))
    grad.addColorStop(0.55, '#' + c1.toString(16).padStart(6,'0'))
    grad.addColorStop(1,    '#' + c2.toString(16).padStart(6,'0'))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Static stars for night levels (baked in — no twinkling here, live objects handle that)
    if ([1, 3, 4].includes(this.level.id)) {
      for (let i = 0; i < 55; i++) {
        const bright = Math.random() > 0.5
        ctx.fillStyle = bright ? 'rgba(255,255,255,0.75)' : 'rgba(180,200,255,0.3)'
        ctx.fillRect(
          (Math.random() * W) | 0,
          (Math.random() * groundY * 0.78) | 0,
          Math.random() < 0.12 ? 2 : 1, 1
        )
      }
    }

    const key = `sky_${this.level.id}`
    this.scene.textures.addCanvas(key, cvs)
    this.layers.push({ obj: this.scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(-10), tile: false, speed: 0 })
  }

  // ── Moon or sun ─────────────────────────────────────────────────────
  _celestial() {
    const { W, H } = this
    const g  = this.scene.add.graphics().setScrollFactor(0).setDepth(-9)
    const mx = W * 0.78, my = H * 0.09
    const r  = Math.max(9, W * 0.023)

    if (this.level.id === 2) {
      g.fillStyle(0xfff59d, 1); g.fillCircle(mx, my, r)
      g.fillStyle(0xffee58, 0.28); g.fillCircle(mx, my, r * 1.55)
    } else {
      g.fillStyle(this.level.id === 4 ? 0xd0e8ff : 0xeeeedd, 0.92)
      g.fillCircle(mx, my, r)
      // Crater detail
      g.fillStyle(0x000000, 0.07)
      g.fillCircle(mx - r * 0.32, my - r * 0.18, r * 0.26)
      g.fillCircle(mx + r * 0.22, my + r * 0.28, r * 0.18)
    }
    this.layers.push({ obj: g, tile: false, speed: 0 })
  }

  // ── Three building layers ────────────────────────────────────────────
  _buildings() {
    const { W, groundY } = this
    const lv = this.level

    // Heights kept modest so sky stays prominent
    // far:  8–26% of groundY
    // mid: 18–40%
    // near: 26–46%
    this._buildStrip('far',  W, groundY, lv, 0.08, -6, 0.08, 0.26, false)
    this._buildStrip('mid',  W, groundY, lv, 0.25, -5, 0.18, 0.40, false)
    this._buildStrip('near', W, groundY, lv, 0.50, -4, 0.26, 0.46, true)
  }

  _buildStrip(name, W, groundY, lv, scrollFactor, depth, minHF, maxHF, withDetail) {
    const totalW = W * 4
    const cvs = document.createElement('canvas')
    cvs.width = totalW; cvs.height = groundY + 2
    const ctx = cvs.getContext('2d')

    // Track building positions for anchoring animated elements
    const buildingRects = []

    let x = 0
    while (x < totalW) {
      const bw = (W * 0.032 + Math.random() * W * 0.068) | 0
      const bh = (groundY * minHF + Math.random() * groundY * (maxHF - minHF)) | 0
      const by = groundY - bh

      // Pick base color
      const baseCol = lv.buildingColors[Math.floor(Math.random() * lv.buildingColors.length)]

      // Atmospheric depth: far=lighter, mid=base, near=slightly darker
      const adjust = name === 'far' ? 0.25 : name === 'mid' ? 0.10 : 0
      const r = Math.min(255, (((baseCol >> 16) & 0xff) * (1 + adjust)) | 0)
      const g = Math.min(255, (((baseCol >>  8) & 0xff) * (1 + adjust)) | 0)
      const b = Math.min(255, ((baseCol & 0xff) * (1 + adjust)) | 0)
      const colStr = `rgb(${r},${g},${b})`

      // Main body
      ctx.fillStyle = colStr
      ctx.fillRect(x, by, bw, bh)

      // Slight top highlight — makes buildings feel lit from above
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(x, by, bw, 3)

      // Darker right face for subtle 3-D feel
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(x + bw - 3, by, 3, bh)

      // ── Building shape variety (near layer only) ────────────────
      if (withDetail) {
        // Occasional setback (step) in upper portion
        if (Math.random() < 0.35 && bw > 24) {
          const setW = (bw * (0.3 + Math.random() * 0.3)) | 0
          const setH = (bh * (0.2 + Math.random() * 0.25)) | 0
          const setX = x + (Math.random() < 0.5 ? 0 : bw - setW)
          ctx.fillStyle = colStr
          ctx.fillRect(setX, by - setH, setW, setH)
          ctx.fillStyle = 'rgba(255,255,255,0.06)'
          ctx.fillRect(setX, by - setH, setW, 3)
        }

        // Rooftop water tower
        if (Math.random() < 0.28 && bw >= 22) {
          const tx = x + (bw * 0.35 + Math.random() * bw * 0.3) | 0
          const th = 8 + Math.random() * 6 | 0
          const tw = 10 + Math.random() * 6 | 0
          const darkened = `rgb(${Math.max(0,r-20)},${Math.max(0,g-20)},${Math.max(0,b-20)})`
          ctx.fillStyle = darkened
          ctx.fillRect(tx, by - th, tw, th)
          // Cone top
          ctx.fillStyle = darkened
          ctx.beginPath()
          ctx.moveTo(tx + tw/2, by - th - 5)
          ctx.lineTo(tx, by - th)
          ctx.lineTo(tx + tw, by - th)
          ctx.closePath(); ctx.fill()
        }

        // Antenna / spire
        if (Math.random() < 0.30) {
          ctx.fillStyle = `rgba(${r},${g},${b},0.7)`
          const ax = x + (bw * 0.45 + Math.random() * bw * 0.1) | 0
          const ah = 6 + Math.random() * 12 | 0
          ctx.fillRect(ax, by - ah, 2, ah)
          // Blinking light dot — recorded for animation
          if (this.level.id !== 2) {
            buildingRects.push({ type: 'antenna', sx: ax + 1, sy: by - ah - 1, worldXFrac: x / totalW })
          }
        }

        // Windows (small, sparse, only on near buildings)
        const wc = '#' + lv.windowColor.toString(16).padStart(6, '0')
        const wSize = Math.max(3, (bw * 0.12) | 0)
        const wGapX = wSize * 2.0
        const wGapY = wSize * 2.2
        for (let wy = by + wSize; wy < groundY - wSize * 2; wy += wGapY) {
          for (let wx = x + wSize; wx < x + bw - wSize; wx += wGapX) {
            if (Math.random() > 0.45) {
              // Lit window
              ctx.fillStyle = wc
              ctx.globalAlpha = 0.55 + Math.random() * 0.35
              ctx.fillRect(wx | 0, wy | 0, wSize, (wSize * 1.4) | 0)
              ctx.globalAlpha = 1
            }
          }
        }

        // Neon sign ON the building facade (near layer, night levels)
        if ([1, 4].includes(this.level.id) && Math.random() < 0.35 && bw >= 18) {
          const neonColors = [0xff00ff, 0x00ffff, 0xff2d78, 0xf5e642, 0x00ff88]
          const nc = neonColors[Math.floor(Math.random() * neonColors.length)]
          const nr = (nc >> 16) & 0xff, ng = (nc >> 8) & 0xff, nb = nc & 0xff
          const signW = (bw * 0.5 + Math.random() * bw * 0.3) | 0
          const signX = x + (Math.random() * (bw - signW)) | 0
          const signY = by + (bh * 0.25 + Math.random() * bh * 0.4) | 0

          ctx.fillStyle = `rgba(${nr},${ng},${nb},0.9)`
          ctx.fillRect(signX, signY, signW, 4)
          ctx.fillRect(signX, signY + 7, signW * 0.65, 3)

          // Glow halo
          const grd = ctx.createRadialGradient(signX + signW/2, signY + 2, 0, signX + signW/2, signY + 2, signW * 0.6)
          grd.addColorStop(0, `rgba(${nr},${ng},${nb},0.18)`)
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grd
          ctx.fillRect(signX - signW * 0.3, signY - 6, signW * 1.6, 20)

          buildingRects.push({ type: 'neon', sx: signX + totalW * 0, sy: signY, sw: signW, nc, worldXFrac: x / totalW })
        }

        // Suburbia: colored roof
        if (this.level.id === 2) {
          const roofColors = [0xcc4444, 0x4466cc, 0x887722, 0x446644]
          const rc = roofColors[Math.floor(Math.random() * roofColors.length)]
          const rr = (rc >> 16) & 0xff, rg2 = (rc >> 8) & 0xff, rb = rc & 0xff
          ctx.fillStyle = `rgb(${rr},${rg2},${rb})`
          // Triangle roof
          ctx.beginPath()
          ctx.moveTo(x + bw/2, by - 12 - Math.random() * 8)
          ctx.lineTo(x - 4, by)
          ctx.lineTo(x + bw + 4, by)
          ctx.closePath(); ctx.fill()
        }

        // Industrial: horizontal pipe / duct on facade
        if (this.level.id === 3 && Math.random() < 0.3) {
          ctx.fillStyle = 'rgba(180,140,80,0.6)'
          const pipeY = by + bh * (0.4 + Math.random() * 0.3) | 0
          ctx.fillRect(x, pipeY, bw, 4)
          ctx.fillStyle = 'rgba(255,200,100,0.3)'
          ctx.fillRect(x, pipeY, bw, 1)
        }
      } else {
        // Mid/far layers: just a few tiny lit windows — no signs
        if (bw > 16) {
          const wc = '#' + lv.windowColor.toString(16).padStart(6, '0')
          const wSize = Math.max(2, (bw * 0.10) | 0)
          for (let wy = by + wSize * 1.5; wy < groundY - wSize; wy += wSize * 2.8) {
            for (let wx = x + wSize; wx < x + bw - wSize; wx += wSize * 2.2) {
              if (Math.random() > 0.55) {
                ctx.fillStyle = wc
                ctx.globalAlpha = 0.35 + Math.random() * 0.25
                ctx.fillRect(wx | 0, wy | 0, wSize, (wSize * 1.3) | 0)
                ctx.globalAlpha = 1
              }
            }
          }
        }
      }

      x += bw + (Math.random() * 6 + 2 | 0)
    }

    const key = `bld_${name}_${this.level.id}`
    this.scene.textures.addCanvas(key, cvs)

    const ts = this.scene.add.tileSprite(0, 0, W, groundY + 2, key)
      .setOrigin(0, 0).setDepth(depth).setScrollFactor(0)
    this.layers.push({ obj: ts, tile: true, speed: scrollFactor })

    // Spawn animated elements at near-layer building positions
    if (withDetail) this._spawnLiveDetails(buildingRects, totalW, W)
  }

  // ── Live animated details anchored to near buildings ─────────────────
  _spawnLiveDetails(rects, totalW, W) {
    const { groundY } = this

    // Twinkling antenna lights
    rects.filter(r => r.type === 'antenna').forEach(rec => {
      const screenX = (rec.worldXFrac % 1) * W  // approximate screen position
      if (screenX < 0 || screenX > W) return
      const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-3)
      g.fillStyle(0xff4444, 1)
      g.fillRect(rec.sx % W, rec.sy, 2, 2)
      this.scene.tweens.add({
        targets: g, alpha: { from: 1, to: 0 },
        duration: 600 + Math.random() * 800,
        yoyo: true, repeat: -1, delay: Math.random() * 2000,
      })
      this._live.push(g)
    })

    // Twinkling stars (night levels only, live so they pulse)
    if ([1, 3, 4].includes(this.level.id)) {
      for (let i = 0; i < 10; i++) {
        const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-8)
        const sx = Math.random() * W, sy = Math.random() * groundY * 0.72
        g.fillStyle(Math.random() > 0.4 ? 0xffffff : 0xaabbff, 1)
        g.fillRect(sx | 0, sy | 0, Math.random() < 0.15 ? 2 : 1, Math.random() < 0.15 ? 2 : 1)
        this.scene.tweens.add({
          targets: g, alpha: { from: Math.random() * 0.3 + 0.05, to: 0.95 },
          duration: 900 + Math.random() * 1400, yoyo: true, repeat: -1,
          delay: Math.random() * 2500, ease: 'Sine.InOut',
        })
        this._live.push(g)
      }
    }

    // Drifting clouds (Suburbia)
    if (this.level.id === 2) {
      for (let i = 0; i < 3; i++) {
        const cx = W * (0.08 + Math.random() * 0.75)
        const cy = groundY * (0.06 + Math.random() * 0.20)
        const rw = W * (0.055 + Math.random() * 0.055)
        const g  = this.scene.add.graphics().setScrollFactor(0).setDepth(-7)
        g.fillStyle(0xffffff, 0.5)
        g.fillEllipse(0, 0, rw * 2, rw * 0.65)
        g.fillEllipse(rw * 0.42, -rw * 0.22, rw * 1.15, rw * 0.7)
        g.fillEllipse(-rw * 0.38, -rw * 0.18, rw * 0.9, rw * 0.6)
        g.x = cx; g.y = cy
        const spd = 10 + Math.random() * 12
        this.scene.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            if (!g.active) return
            g.x -= spd * 0.016
            if (g.x < -rw * 2) g.x = W + rw * 2
          }
        })
        this._live.push(g)
      }
    }

    // Smoke puffs (Industrial)
    if (this.level.id === 3) {
      const chimneyXs = [W * 0.12, W * 0.42, W * 0.68, W * 0.85]
      chimneyXs.forEach(cx => {
        const emit = () => {
          if (!this.scene.scene?.isActive?.('GameScene')) return
          const g = this.scene.add.graphics().setScrollFactor(0).setDepth(-3)
          const r = 5 + Math.random() * 5
          g.fillStyle(0x998877, 1)
          g.fillCircle(0, 0, r)
          g.x = cx + (Math.random() - 0.5) * 10
          g.y = groundY * 0.34 + Math.random() * 8
          g.setAlpha(0.45)
          this.scene.tweens.add({
            targets: g,
            y:      g.y - 50 - Math.random() * 30,
            x:      g.x + (Math.random() - 0.5) * 22,
            alpha:  0,
            scaleX: 3, scaleY: 3,
            duration: 2000 + Math.random() * 1000,
            ease: 'Cubic.Out',
            onComplete: () => { if (g.active) g.destroy(); emit() }
          })
          this._live.push(g)
        }
        this.scene.time.delayedCall(Math.random() * 1800, emit)
      })
    }
  }

  // ── Dark fog just above ground line ─────────────────────────────────
  _groundFog() {
    const { W, groundY } = this
    const fogH = Math.max(16, groundY * 0.06)
    const g    = this.scene.add.graphics().setScrollFactor(0).setDepth(-2)
    for (let i = 0; i < fogH; i++) {
      g.fillStyle(0x000000, (i / fogH) * 0.48)
      g.fillRect(0, groundY - fogH + i, W, 1)
    }
    this.layers.push({ obj: g, tile: false, speed: 0 })
  }

  // ── Per-frame update ─────────────────────────────────────────────────
  update(delta, gameSpeed) {
    const dx = (gameSpeed / 1000) * delta
    for (const layer of this.layers) {
      if (layer.tile) layer.obj.tilePositionX += dx * layer.speed
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────
  destroy() {
    for (const l of this.layers) l.obj.destroy()
    this.layers = []
    for (const a of this._live) { try { a.destroy() } catch {} }
    this._live = []
  }
}
