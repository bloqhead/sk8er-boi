export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.pool  = []
  }

  spawnOllieParticles(x, y, power = 0.5) {
    const count = 3 + Math.floor(power * 6)
    const colors = ['#f5e642', '#ff2d78', '#00f5ff', '#39ff14']
    for (let i = 0; i < count; i++) {
      this._spawn(x, y, colors[i % colors.length], {
        vx: (Math.random() - 0.5) * 80,
        vy: -(Math.random() * 80 + 40),
        size: 1 + Math.random() * 1.5,
        life: 0.4 + Math.random() * 0.3
      })
    }
  }

  spawnLandParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      this._spawn(x + (Math.random() - 0.5) * 10, y, '#aaaaaa', {
        vx: (Math.random() - 0.5) * 60,
        vy: -(Math.random() * 30 + 10),
        size: 1, life: 0.3
      })
    }
  }

  spawnGrindSparks(x, y) {
    for (let i = 0; i < 4; i++) {
      this._spawn(x + (Math.random() - 0.5) * 6, y, '#f5e642', {
        vx: (Math.random() - 0.5) * 50 - 20,
        vy: -(Math.random() * 30 + 15),
        size: 1, life: 0.18
      })
    }
  }

  spawnCrashParticles(x, y) {
    const colors = ['#ff2d78', '#f5e642', '#ffffff', '#ff6600']
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const spd = 40 + Math.random() * 80
      this._spawn(x, y, colors[i % colors.length], {
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 50,
        size: 1 + Math.random() * 2,
        life: 0.5 + Math.random() * 0.4
      })
    }
    this._spawnText(x, y - 18, 'BAILED!', '#ff2d78')
  }

  spawnScoreParticles(x, y, text, color = '#f5e642') {
    this._spawnText(x, y - 10, text, color)
  }

  spawnSpeedLines(x, y, intensity = 1) {
    if (Math.random() > intensity * 0.4) return
    this._spawn(x + 20, y + (Math.random() - 0.5) * 30, 'rgba(255,255,255,0.2)', {
      vx: -200 * intensity, vy: 0,
      size: 0.5, life: 0.10, wide: true
    })
  }

  spawnRampLaunchEffect(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
      const spd = 60 + Math.random() * 100
      this._spawn(x, y, '#f5e642', {
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        size: 1.5, life: 0.4
      })
    }
    this._spawnText(x, y - 16, 'LAUNCH!', '#f5e642')
  }

  spawnTrickEffect(x, y, name) {
    const colors = ['#f5e642', '#ff2d78', '#00f5ff']
    for (let i = 0; i < 8; i++) {
      this._spawn(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*10,
        colors[i % colors.length], {
          vx: (Math.random()-0.5)*100, vy: -(Math.random()*60+30),
          size: 1, life: 0.5
        })
    }
    this._spawnText(x, y - 22, name, '#00f5ff')
  }

  spawnWheelSmoke(x, y) {
    if (Math.random() > 0.3) return
    this._spawn(x, y, 'rgba(160,160,160,0.35)', {
      vx: (Math.random()-0.5) * 15,
      vy: -(Math.random() * 10),
      size: 1.5, life: 0.25, fade: true
    })
  }

  _spawn(x, y, color, opts = {}) {
    const g = this.scene.add.graphics().setDepth(20)
    const sz = (opts.size || 1) * 3  // 3px per logical pixel
    g.fillStyle(this._cssToHex(color), this._cssToAlpha(color))
    if (opts.wide) {
      g.fillRect(-sz * 4, -sz / 2, sz * 8, sz)
    } else {
      g.fillRect(-sz / 2, -sz / 2, sz, sz)
    }
    g.x = x; g.y = y
    const p = { obj: g, vx: opts.vx || 0, vy: opts.vy || 0,
                life: opts.life || 0.4, maxLife: opts.life || 0.4,
                fade: opts.fade || false }
    this.pool.push(p)
    return p
  }

  _spawnText(x, y, text, color) {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: "'Press Start 2P'", fontSize: '5px',
      color, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25)
    this.pool.push({
      obj: t, vx: 0, vy: -30,
      life: 0.85, maxLife: 0.85,
      fade: true, text: true
    })
  }

  update(delta) {
    const dt = delta / 1000
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i]
      p.life -= dt
      if (p.life <= 0) {
        p.obj.destroy()
        this.pool.splice(i, 1)
        continue
      }
      p.obj.x += p.vx * dt
      p.obj.y += p.vy * dt
      p.vy    += 150 * dt   // gravity

      const t = p.life / p.maxLife
      if (p.fade || p.text) p.obj.setAlpha(t)
      if (p.text) p.obj.setScale(0.8 + t * 0.3)
    }
  }

  _cssToHex(color) {
    if (typeof color === 'number') return color
    if (color.startsWith('#')) return parseInt(color.slice(1), 16)
    return 0xffffff
  }
  _cssToAlpha(color) {
    if (color.startsWith('rgba')) {
      const m = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/)
      return m ? parseFloat(m[1]) : 1
    }
    return 1
  }

  destroy() {
    for (const p of this.pool) p.obj.destroy()
    this.pool = []
  }
}
