export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
  }

  spawnOllieParticles(x, y, power = 0.5) {
    const count = 4 + Math.floor(power * 8)
    const colors = ['#f5e642', '#ff2d78', '#00f5ff', '#39ff14']
    for (let i = 0; i < count; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)]
      const p = this._spawn(x, y, c, {
        vx: (Math.random() - 0.5) * 180,
        vy: -(Math.random() * 200 + 100),
        size: 2 + Math.floor(Math.random() * 3),
        life: 0.4 + Math.random() * 0.4
      })
    }
  }

  spawnLandParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      this._spawn(x + (Math.random() - 0.5) * 20, y, '#aaaaaa', {
        vx: (Math.random() - 0.5) * 140,
        vy: -(Math.random() * 60 + 20),
        size: 2,
        life: 0.3
      })
    }
  }

  spawnGrindSparks(x, y) {
    for (let i = 0; i < 3; i++) {
      this._spawn(x + (Math.random() - 0.5) * 10, y, '#f5e642', {
        vx: (Math.random() - 0.5) * 100 - 40,
        vy: -(Math.random() * 60 + 30),
        size: 1,
        life: 0.15
      })
    }
  }

  spawnCrashParticles(x, y) {
    const colors = ['#ff2d78', '#f5e642', '#ffffff', '#ff6600']
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const speed = 80 + Math.random() * 160
      this._spawn(x, y, colors[Math.floor(Math.random() * colors.length)], {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        size: 2 + Math.floor(Math.random() * 3),
        life: 0.5 + Math.random() * 0.5
      })
    }

    // Score text pop
    this._spawnText(x, y - 30, 'BAILED!', '#ff2d78')
  }

  spawnScoreParticles(x, y, text, color = '#f5e642') {
    this._spawnText(x, y - 20, text, color)
    for (let i = 0; i < 5; i++) {
      this._spawn(x + (Math.random() - 0.5) * 30, y, color, {
        vx: (Math.random() - 0.5) * 120,
        vy: -(Math.random() * 100 + 50),
        size: 2,
        life: 0.5
      })
    }
  }

  spawnSpeedLines(x, y, speed = 1) {
    if (Math.random() > speed * 0.3) return
    this._spawn(x + 60, y + (Math.random() - 0.5) * 60, 'rgba(255,255,255,0.3)', {
      vx: -300 * speed,
      vy: 0,
      size: 1,
      life: 0.12,
      wide: true
    })
  }

  spawnRampLaunchEffect(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
      const speed = 150 + Math.random() * 200
      this._spawn(x, y, '#f5e642', {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.floor(Math.random() * 2),
        life: 0.4 + Math.random() * 0.3
      })
    }
    this._spawnText(x, y - 30, 'LAUNCH!', '#f5e642')
  }

  spawnTrickEffect(x, y, trickName) {
    const colors = ['#f5e642', '#ff2d78', '#00f5ff']
    for (let i = 0; i < 10; i++) {
      this._spawn(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 20,
        colors[Math.floor(Math.random() * colors.length)], {
          vx: (Math.random() - 0.5) * 200,
          vy: -(Math.random() * 150 + 50),
          size: 2,
          life: 0.6
        })
    }
    this._spawnText(x, y - 40, trickName, '#00f5ff')
  }

  spawnWheelSmoke(x, y) {
    if (Math.random() > 0.4) return
    this._spawn(x, y, 'rgba(180,180,180,0.4)', {
      vx: (Math.random() - 0.5) * 30,
      vy: -(Math.random() * 20),
      size: 2 + Math.floor(Math.random() * 3),
      life: 0.3,
      fade: true
    })
  }

  _spawn(x, y, color, opts = {}) {
    const S = 4
    const g = this.scene.add.graphics()
    g.fillStyle(this._cssToHex(color), this._cssToAlpha(color))
    const size = (opts.size || 2) * S
    if (opts.wide) {
      g.fillRect(-size * 3, -size / 2, size * 6, size)
    } else {
      g.fillRect(-size / 2, -size / 2, size, size)
    }
    g.x = x
    g.y = y
    g.setDepth(20)

    const p = {
      obj: g,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      life: opts.life || 0.4,
      maxLife: opts.life || 0.4,
      fade: opts.fade || false
    }
    this.particles.push(p)
    return p
  }

  _spawnText(x, y, text, color) {
    const S = 4
    const t = this.scene.add.text(x, y, text, {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color,
      stroke: '#000000',
      strokeThickness: S
    }).setOrigin(0.5).setDepth(25)

    const p = {
      obj: t,
      vx: 0,
      vy: -60,
      life: 0.9,
      maxLife: 0.9,
      fade: true,
      text: true
    }
    this.particles.push(p)
  }

  update(delta) {
    const dt = delta / 1000

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) {
        p.obj.destroy()
        this.particles.splice(i, 1)
        continue
      }

      p.obj.x += p.vx * dt
      p.obj.y += p.vy * dt
      p.vy += 200 * dt // gravity on particles

      const t = p.life / p.maxLife
      if (p.fade || p.text) {
        p.obj.setAlpha(t)
      }

      if (p.text) {
        p.obj.setScale(0.8 + t * 0.4)
      }
    }
  }

  _cssToHex(color) {
    if (typeof color === 'number') return color
    if (color.startsWith('#')) {
      return parseInt(color.slice(1), 16)
    }
    return 0xffffff
  }

  _cssToAlpha(color) {
    if (color.startsWith('rgba')) {
      const m = color.match(/rgba\([\d.,\s]+,\s*([\d.]+)\)/)
      return m ? parseFloat(m[1]) : 1
    }
    return 1
  }

  destroy() {
    for (const p of this.particles) {
      p.obj.destroy()
    }
    this.particles = []
  }
}
