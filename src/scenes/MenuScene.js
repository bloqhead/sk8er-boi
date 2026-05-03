import { audio }  from '../audio/AudioManager.js'
import { LEVELS } from '../data/levels.js'
import { layout } from '../systems/Layout.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
    this.selectedLevel = 0
    this.menuIndex     = 0
  }

  create() {
    audio.resume()
    // Hide arcade panel — only visible during gameplay
    const panel = document.getElementById('arcade-panel')
    if (panel) panel.style.display = 'none'

    this._build()
    this.scale.on('resize', () => { this.children.removeAll(true); this._build() })
  }

  shutdown() {
    this.scale.off('resize')
  }

  _build() {
    const L = layout(this)
    const { W, H, u, font, isPortrait } = L

    // ── Background ────────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x040410, 0x040410, 0x08143a, 0x08143a, 1)
    bg.fillRect(0, 0, W, H)

    for (let i = 0; i < 70; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.45 + 0.08)
      g.fillRect(
        Math.floor(Math.random() * W),
        Math.floor(Math.random() * H * 0.85),
        Math.random() < 0.12 ? 2 : 1,
        Math.random() < 0.12 ? 2 : 1,
      )
    }

    // ── Proportional layout ───────────────────────────────────────────
    // Divide the screen into logical bands so nothing overlaps.
    // We compute each element's Y from a running cursor.

    const margin  = u * 0.6
    const padding = u * 0.4
    let cursor    = margin

    // ── Title ─────────────────────────────────────────────────────────
    const titleSize = Math.min(font.xl, Math.floor(W / 9))   // cap on narrow screens
    const title = this.add.text(W / 2, cursor, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize:   titleSize + 'px',
      color:      '#f5e642',
      stroke:     '#000000',
      strokeThickness: Math.max(2, titleSize * 0.22),
      shadow: { offsetX: 2, offsetY: 2, color: '#ff2d78', blur: 0, fill: true },
    }).setOrigin(0.5, 0)

    this.tweens.add({
      targets: title, y: cursor - u * 0.3,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })
    cursor += titleSize + padding

    // Subtitle
    const subSize = Math.min(font.xs, Math.floor(W / 24))
    this.add.text(W / 2, cursor, '"SKATE OR BAIL"', {
      fontFamily: "'Press Start 2P'", fontSize: subSize + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0)
    cursor += subSize + padding * 2

    // ── Skater sprite — sized to fit remaining space ───────────────────
    // Sprite frame is 36×54 canvas pixels. We want it no taller than
    // ~15% of screen height, and never wider than 25% of screen width.
    const spriteCanvasH = 54   // px at scale 1
    const spriteCanvasW = 36
    const maxSpriteH    = Math.min(H * 0.14, W * 0.18)
    const spriteScale   = Math.max(1, Math.floor(maxSpriteH / spriteCanvasH))
    const spriteH       = spriteCanvasH * spriteScale
    const spriteY       = cursor + spriteH / 2

    const skater = this.add.image(W / 2, spriteY, 'skater', 'roll_a')
      .setScale(spriteScale)
    this.tweens.add({
      targets: skater, y: spriteY - u * 0.3,
      duration: 380, yoyo: true, repeat: -1, ease: 'Bounce.Out',
    })
    this.time.addEvent({ delay: 180, loop: true, callback: () => {
      skater.setFrame(skater.frame.name === 'roll_a' ? 'roll_b' : 'roll_a')
    }})
    cursor += spriteH + padding * 2

    // ── Level select label ────────────────────────────────────────────
    const lvLabelSize = Math.min(font.sm, Math.floor(W / 22))
    this.add.text(W / 2, cursor, 'SELECT LEVEL', {
      fontFamily: "'Press Start 2P'", fontSize: lvLabelSize + 'px', color: '#00f5ff',
    }).setOrigin(0.5, 0)
    cursor += lvLabelSize + padding

    // ── Level grid ────────────────────────────────────────────────────
    this._levelY = cursor
    this._levelL = L
    this._levelContainer = null
    const levelGridH = this._drawLevels(L)
    cursor += levelGridH + padding * 2

    // ── Menu items ────────────────────────────────────────────────────
    const menuSize = Math.min(font.md, Math.floor(W / 16))
    const menuGap  = menuSize * 2.8
    const items = [
      { label: 'START GAME',  action: () => this._start() },
      { label: 'LEADERBOARD', action: () => this.scene.start('LeaderboardScene') },
    ]

    this.menuTexts = items.map((item, i) => {
      const ty = cursor + i * menuGap
      const t = this.add.text(W / 2, ty, item.label, {
        fontFamily: "'Press Start 2P'",
        fontSize:   menuSize + 'px',
        color:      i === this.menuIndex ? '#f5e642' : '#777777',
      }).setOrigin(0.5, 0)

      const zone = this.add.rectangle(W / 2, ty + menuSize, Math.min(W * 0.85, 320), menuGap * 0.95, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { this.menuIndex = i; this._updateCursor(); audio.playMenuBeep(440) })
      zone.on('pointerdown', () => { audio.playMenuBeep(660); item.action() })
      return t
    })

    this._cursorTxt = this.add.text(0, 0, '▶', {
      fontFamily: "'Press Start 2P'", fontSize: menuSize + 'px', color: '#f5e642',
    })
    this._menuTopY  = cursor
    this._menuGap   = menuGap
    this._menuSize  = menuSize
    this._updateCursor()

    cursor += items.length * menuGap + padding

    // Controls hint — only if it fits
    const remaining = H - cursor
    if (remaining > u * 2) {
      this.add.text(W / 2, H - u * 0.6, '← → SPEED   ↑/SPACE OLLIE', {
        fontFamily: "'Press Start 2P'", fontSize: Math.max(4, font.xs - 1) + 'px', color: '#333355',
      }).setOrigin(0.5, 1)
    }

    // ── Keyboard nav ──────────────────────────────────────────────────
    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown-UP',    () => { this.menuIndex = Math.max(0, this.menuIndex - 1);                  this._updateCursor(); audio.playMenuBeep(400) })
    this.input.keyboard.on('keydown-DOWN',  () => { this.menuIndex = Math.min(items.length - 1, this.menuIndex + 1);   this._updateCursor(); audio.playMenuBeep(400) })
    this.input.keyboard.on('keydown-ENTER', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-SPACE', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-LEFT',  () => { this.selectedLevel = Math.max(0, this.selectedLevel - 1);                  this._drawLevels(L); audio.playMenuBeep(330) })
    this.input.keyboard.on('keydown-RIGHT', () => { this.selectedLevel = Math.min(LEVELS.length - 1, this.selectedLevel + 1);  this._drawLevels(L); audio.playMenuBeep(370) })
  }

  // Returns the height consumed by the grid
  _drawLevels(L) {
    if (this._levelContainer) this._levelContainer.destroy()
    this._levelContainer = this.add.container(0, 0)

    const { W, u, isPortrait } = L
    const cols  = isPortrait ? 2 : 4
    const gapX  = Math.max(4, u * 0.3)
    const gapY  = Math.max(4, u * 0.3)
    const bw    = Math.floor((W - u * 2 - gapX * (cols - 1)) / cols)

    // Font sizes that fit in the box
    const nameSize = Math.max(5, Math.min(10, Math.floor(bw / 9)))
    const subSize  = Math.max(4, Math.min(8,  Math.floor(bw / 12)))
    const bh       = nameSize + subSize + u * 1.2

    const rows    = Math.ceil(LEVELS.length / cols)
    const totalW  = cols * bw + (cols - 1) * gapX
    const sx      = (W - totalW) / 2
    const startY  = this._levelY

    LEVELS.forEach((lv, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const bx  = sx + col * (bw + gapX)
      const by  = startY + row * (bh + gapY)
      const sel = i === this.selectedLevel

      const box = this.add.rectangle(bx, by, bw, bh, sel ? 0x0d0d28 : 0x06060f)
        .setOrigin(0).setStrokeStyle(sel ? 1.5 : 0.5, sel ? 0xf5e642 : 0x1e1e44)
        .setInteractive({ useHandCursor: true })
      box.on('pointerdown', () => { this.selectedLevel = i; this._drawLevels(L || this._levelL); audio.playMenuBeep(440) })

      const name = this.add.text(bx + bw / 2, by + bh * 0.25, lv.name, {
        fontFamily: "'Press Start 2P'", fontSize: nameSize + 'px',
        color: sel ? '#f5e642' : '#777799',
      }).setOrigin(0.5)

      const sub = this.add.text(bx + bw / 2, by + bh * 0.70, lv.subtitle, {
        fontFamily: "'Press Start 2P'", fontSize: subSize + 'px',
        color: sel ? '#aaaacc' : '#333355', wordWrap: { width: bw - 8 },
      }).setOrigin(0.5)

      this._levelContainer.add([box, name, sub])
    })

    return rows * (bh + gapY)
  }

  _updateCursor() {
    if (!this.menuTexts?.length) return
    const x = this.scale.width / 2 - this.menuTexts[0].width / 2 - (this._menuSize || 8) - 4
    this._cursorTxt.setPosition(x, this._menuTopY + this.menuIndex * this._menuGap)
    this.menuTexts.forEach((t, i) => t.setColor(i === this.menuIndex ? '#f5e642' : '#777777'))
  }

  _start() {
    // Show arcade panel when entering game
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
    const panel   = document.getElementById('arcade-panel')
    if (panel && isTouch) panel.style.display = 'block'

    this.scene.start('GameScene', { levelId: LEVELS[this.selectedLevel].id })
    this.scene.launch('HUDScene')
  }
}
