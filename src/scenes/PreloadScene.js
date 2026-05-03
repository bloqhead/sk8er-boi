import { SpriteFactory } from '../systems/SpriteFactory.js'
import { Leaderboard }   from '../data/leaderboard.js'
import { LEVELS }        from '../data/levels.js'
import { layout }        from '../systems/Layout.js'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene') }

  create() {
    // Always hide arcade panel on loading screen
    const panel = document.getElementById('arcade-panel')
    if (panel) panel.style.display = 'none'
    if (window._sk8_resizeGame) window._sk8_resizeGame()

    const { W, H, font, u } = layout(this)

    // ── Background ────────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x040410, 0x040410, 0x08143a, 0x08143a, 1)
    bg.fillRect(0, 0, W, H)

    // Stars
    for (let i = 0; i < 60; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.4 + 0.08)
      g.fillRect(Math.random() * W | 0, Math.random() * H * 0.8 | 0,
        Math.random() < 0.1 ? 2 : 1, 1)
    }

    // ── Title ─────────────────────────────────────────────────────────
    const titleSize = Math.min(font.xl, Math.floor(W / 9))
    const title = this.add.text(W / 2, H * 0.18, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize:   titleSize + 'px',
      color:      '#f5e642',
      stroke:     '#000000',
      strokeThickness: Math.max(2, titleSize * 0.22),
      shadow: { offsetX: 2, offsetY: 2, color: '#ff2d78', blur: 0, fill: true },
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title, y: H * 0.18 - u * 0.3,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    // ── Ground strip where skater rolls ───────────────────────────────
    const groundY = H * 0.72
    this.add.rectangle(0, groundY, W, 2, 0x2244aa, 0.6).setOrigin(0)
    this.add.rectangle(0, groundY, W, H - groundY, 0x08101e, 0.5).setOrigin(0)

    // ── Animated skater rolling across ────────────────────────────────
    // Uses the spritesheet once it's loaded — we draw a quick inline version first
    const skaterGfx = this.add.graphics()
    const sk = { x: -40, y: groundY - 28 }  // start off-screen left

    // Simple animated pixel skater drawn with graphics (before sheet loads)
    let animFrame = 0
    const drawSkater = (frame) => {
      skaterGfx.clear()
      const sx = sk.x, sy = sk.y
      const S = 3
      const skin = 0xF5CBA7, shirt = 0xFF2D78, pants = 0x1C3A8A
      const shoe = 0x111111, board = 0xC8860A

      // Board
      skaterGfx.fillStyle(board, 1)
      skaterGfx.fillRect(sx - 14, sy + 16, 28, 5)
      // Wheels
      skaterGfx.fillStyle(0x333333, 1)
      skaterGfx.fillCircle(sx - 10, sy + 23, 4)
      skaterGfx.fillCircle(sx + 10, sy + 23, 4)
      // Legs (alternate for push animation)
      skaterGfx.fillStyle(pants, 1)
      if (frame === 0) {
        skaterGfx.fillRect(sx - 6, sy + 7, 5, 10)
        skaterGfx.fillRect(sx + 1, sy + 7, 5, 10)
      } else {
        skaterGfx.fillRect(sx - 6, sy + 7, 5, 10)
        skaterGfx.fillRect(sx + 1, sy + 5, 5, 12)  // leg down for push
      }
      // Shoes
      skaterGfx.fillStyle(shoe, 1)
      skaterGfx.fillRect(sx - 8, sy + 15, 7, 3)
      skaterGfx.fillRect(sx + 1, sy + 15, 7, 3)
      // Body
      skaterGfx.fillStyle(shirt, 1)
      skaterGfx.fillRect(sx - 7, sy, 14, 9)
      // Arms
      skaterGfx.fillRect(sx - 10, sy + 1, 4, 6)
      skaterGfx.fillRect(sx + 6,  sy + 1, 4, 6)
      // Head
      skaterGfx.fillStyle(skin, 1)
      skaterGfx.fillRect(sx - 5, sy - 8, 10, 9)
      // Hair
      skaterGfx.fillStyle(0x111111, 1)
      skaterGfx.fillRect(sx - 5, sy - 8, 10, 4)
    }

    // Rolling animation timer
    let pushTimer = 0
    this.time.addEvent({
      delay: 150, loop: true,
      callback: () => { animFrame = 1 - animFrame; drawSkater(animFrame) }
    })
    drawSkater(0)

    // Skater rolls from left to right across the screen
    this.tweens.add({
      targets: sk,
      x: W + 60,
      duration: 2800,
      ease: 'Linear',
      repeat: -1,
      onRepeat: () => { sk.x = -40 },
      onUpdate: () => drawSkater(animFrame),
    })

    // Wheel particle trail
    this.time.addEvent({
      delay: 80, loop: true,
      callback: () => {
        if (sk.x < 0 || sk.x > W) return
        const dot = this.add.graphics()
        dot.fillStyle(0x2244aa, 0.5)
        dot.fillRect(sk.x - 12 + Math.random() * 4, groundY + 20, 2, 2)
        this.tweens.add({ targets: dot, alpha: 0, duration: 400, onComplete: () => dot.destroy() })
      }
    })

    // ── Loading bar ───────────────────────────────────────────────────
    const barW = Math.min(W * 0.65, 320)
    const barH = Math.max(5, u * 0.38)
    const barY = H * 0.84

    this.add.text(W / 2, barY - barH - font.xs - 4, 'LOADING', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#444466',
    }).setOrigin(0.5, 1)

    this.add.rectangle(W / 2, barY, barW + 4, barH + 4, 0x111122).setOrigin(0.5)
    this.add.rectangle(W / 2, barY, barW, barH, 0x0a0a1a).setOrigin(0.5)
    const bar = this.add.rectangle(W / 2 - barW / 2, barY, 0, barH, 0x39ff14).setOrigin(0, 0.5)

    // ── Asset generation ──────────────────────────────────────────────
    const factory = new SpriteFactory(this)
    const tasks = [
      () => factory.createSkaterSheet('skater'),
      () => factory.createTrashCan('trash_can'),
      () => factory.createPerson('person_standing', '#4444ff', false),
      () => factory.createPerson('person_walking',  '#ff4444', true),
      () => factory.createChild('child'),
      () => factory.createDog('dog'),
      () => factory.createCone('cone'),
      () => factory.createBarrel('barrel'),
      () => factory.createMailbox('mailbox'),
      () => factory.createFireHydrant('fire_hydrant'),
      () => factory.createNewsBox('news_box'),
      () => factory.createScooter('scooter'),
      () => factory.createCurb('curb'),
      () => factory.createStairs('stairs'),
      ...LEVELS.map(lv => () => factory.createRamp(`ramp_${lv.id}`)),
      ...LEVELS.map(lv => () => factory.createRail(`rail_${lv.id}`)),
      () => factory.createHeart('heart_full',  true),
      () => factory.createHeart('heart_empty', false),
      () => factory.createStar('star'),
      () => factory.createParticle('particle_white',  '#ffffff', 2),
      () => factory.createParticle('particle_yellow', '#f5e642', 2),
      () => factory.createParticle('particle_pink',   '#ff2d78', 2),
      () => factory.createParticle('particle_cyan',   '#00f5ff', 2),
      () => factory.createSparkle('sparkle_yellow', '#f5e642'),
    ]

    let idx = 0
    const doNext = () => {
      if (idx >= tasks.length) {
        // All done — flash bar green then auto-advance
        bar.width = barW
        bar.setFillStyle(0xf5e642)
        Leaderboard.seedWithDemoData()

        // Brief "READY!" flash, then go straight to menu
        const ready = this.add.text(W / 2, barY + barH + font.xs + 8, 'READY!', {
          fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#39ff14',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5)
        this.tweens.add({ targets: ready, alpha: 0, duration: 200, yoyo: true, repeat: 3 })

        // Auto-advance after 900ms — no key press needed
        this.time.delayedCall(900, () => this.scene.start('MenuScene'))
        return
      }
      try { tasks[idx]() } catch (e) { console.warn('Sprite gen:', e) }
      idx++
      // Progress bar color shifts as it fills
      const pct = idx / tasks.length
      const barColor = pct > 0.8 ? 0xf5e642 : pct > 0.5 ? 0x00f5ff : 0x39ff14
      bar.width   = pct * barW
      bar.setFillStyle(barColor)
      this.time.delayedCall(6, doNext)
    }
    this.time.delayedCall(100, doNext)
  }
}
