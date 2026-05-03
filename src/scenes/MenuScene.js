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
    const panel = document.getElementById('arcade-panel')
    if (panel) panel.style.display = 'none'
    if (window._sk8_resizeGame) window._sk8_resizeGame()
    this._build()
    this.scale.on('resize', () => { this.children.removeAll(true); this._build() })
  }

  shutdown() { this.scale.off('resize') }

  _build() {
    const L = layout(this)
    const { W, H, u, font, isPortrait } = L

    // ── Background ────────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x040410, 0x040410, 0x08143a, 0x08143a, 1)
    bg.fillRect(0, 0, W, H)

    for (let i = 0; i < 70; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.4 + 0.06)
      g.fillRect(Math.random() * W | 0, Math.random() * H * 0.9 | 0,
        Math.random() < 0.12 ? 2 : 1, Math.random() < 0.12 ? 2 : 1)
    }

    // Subtle ground strip at bottom
    this.add.rectangle(0, H - u * 2.5, W, u * 2.5, 0x080e20).setOrigin(0)
    this.add.rectangle(0, H - u * 2.5, W, 1.5, 0x1a2a66, 0.8).setOrigin(0)

    // ── Measure elements so we can distribute them evenly ─────────────
    const titleSize  = Math.min(font.xl, Math.floor(W / 9))
    const subSize    = Math.max(5, Math.min(font.xs, Math.floor(W / 24)))
    const lvLblSize  = Math.max(5, Math.min(font.sm, Math.floor(W / 20)))
    const menuSize   = Math.max(7, Math.min(font.md, Math.floor(W / 16)))

    // Sprite scale: fit within 13% of H or 16% of W, whichever is smaller
    const spriteCanvasH = 54
    const maxSpriteH    = Math.min(H * 0.13, W * 0.16)
    const spriteScale   = Math.max(1, Math.floor(maxSpriteH / spriteCanvasH))
    const spriteH       = spriteCanvasH * spriteScale

    // Level grid dimensions
    const cols   = isPortrait ? 2 : 4
    const gapX   = Math.max(4, u * 0.3)
    const gapY   = gapX
    const bw     = Math.floor((W - u * 2 - gapX * (cols - 1)) / cols)
    const nameFs = Math.max(5, Math.min(10, Math.floor(bw / 9)))
    const subFs  = Math.max(4, Math.min(8,  Math.floor(bw / 13)))
    const bh     = nameFs + subFs + u * 1.1
    const rows   = Math.ceil(LEVELS.length / cols)
    const gridH  = rows * bh + (rows - 1) * gapY

    // Menu items
    const menuGap = menuSize * 2.8
    const menuH   = 2 * menuGap

    // Total content height
    const contentH = titleSize       // title
      + subSize + u * 0.4            // subtitle
      + spriteH + u * 0.4            // skater
      + lvLblSize + u * 0.3          // "SELECT LEVEL"
      + gridH + u * 0.4             // level grid
      + menuH                        // menu items

    // Vertical padding: distribute leftover space evenly between sections
    const totalPad = Math.max(0, H - contentH - u * 3)
    const sections = 6  // gaps between the 7 elements
    const pad      = Math.max(u * 0.5, totalPad / sections)

    let y = Math.max(u * 1.2, (H - contentH - pad * sections) / 2)

    // ── Title ─────────────────────────────────────────────────────────
    const title = this.add.text(W / 2, y, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize:   titleSize + 'px',
      color:      '#f5e642',
      stroke:     '#000000',
      strokeThickness: Math.max(2, titleSize * 0.22),
      shadow: { offsetX: 2, offsetY: 2, color: '#ff2d78', blur: 0, fill: true },
    }).setOrigin(0.5, 0)

    this.tweens.add({
      targets: title, y: y - u * 0.25,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })
    y += titleSize + pad

    // ── Subtitle ──────────────────────────────────────────────────────
    this.add.text(W / 2, y, '"SKATE OR BAIL"', {
      fontFamily: "'Press Start 2P'", fontSize: subSize + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0)
    y += subSize + pad

    // ── Skater sprite ─────────────────────────────────────────────────
    const skaterY = y + spriteH / 2
    const skater  = this.add.image(W / 2, skaterY, 'skater', 'roll_a').setScale(spriteScale)
    this.tweens.add({
      targets: skater, y: skaterY - u * 0.25,
      duration: 380, yoyo: true, repeat: -1, ease: 'Bounce.Out',
    })
    this.time.addEvent({ delay: 180, loop: true, callback: () => {
      skater.setFrame(skater.frame.name === 'roll_a' ? 'roll_b' : 'roll_a')
    }})
    y += spriteH + pad

    // ── Select level label ────────────────────────────────────────────
    this.add.text(W / 2, y, 'SELECT LEVEL', {
      fontFamily: "'Press Start 2P'", fontSize: lvLblSize + 'px', color: '#00f5ff',
    }).setOrigin(0.5, 0)
    y += lvLblSize + pad * 0.6

    // ── Level grid ────────────────────────────────────────────────────
    this._levelY = y
    this._bw = bw; this._bh = bh; this._cols = cols
    this._nameFs = nameFs; this._subFs = subFs
    this._gapX = gapX; this._gapY = gapY
    this._levelContainer = null
    this._drawLevels()
    y += gridH + pad

    // ── Menu items ────────────────────────────────────────────────────
    const items = [
      { label: 'START GAME',  action: () => this._start() },
      { label: 'LEADERBOARD', action: () => this.scene.start('LeaderboardScene') },
    ]

    this.menuTexts = items.map((item, i) => {
      const ty = y + i * menuGap
      const t  = this.add.text(W / 2, ty, item.label, {
        fontFamily: "'Press Start 2P'",
        fontSize:   menuSize + 'px',
        color:      i === this.menuIndex ? '#f5e642' : '#666688',
      }).setOrigin(0.5, 0)

      const zone = this.add.rectangle(W / 2, ty + menuSize * 0.6,
        Math.min(W * 0.85, 340), menuGap * 0.95, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { this.menuIndex = i; this._updateCursor(); audio.playMenuBeep(440) })
      zone.on('pointerdown', () => { audio.playMenuBeep(660); item.action() })
      return t
    })

    this._cursorTxt = this.add.text(0, 0, '▶', {
      fontFamily: "'Press Start 2P'", fontSize: menuSize + 'px', color: '#f5e642',
    })
    this._menuTopY = y; this._menuGap = menuGap; this._menuSize = menuSize
    this._updateCursor()

    // Small controls hint at very bottom if space allows
    if (H - (y + menuH) > u * 1.5) {
      this.add.text(W / 2, H - 6, '← → SPEED   ↑/SPACE OLLIE', {
        fontFamily: "'Press Start 2P'",
        fontSize:   Math.max(4, Math.floor(W / 70)) + 'px',
        color:      '#1a1a33',
      }).setOrigin(0.5, 1)
    }

    // ── Keyboard nav ──────────────────────────────────────────────────
    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown-UP',    () => { this.menuIndex = Math.max(0, this.menuIndex - 1);                 this._updateCursor(); audio.playMenuBeep(400) })
    this.input.keyboard.on('keydown-DOWN',  () => { this.menuIndex = Math.min(items.length - 1, this.menuIndex + 1); this._updateCursor(); audio.playMenuBeep(400) })
    this.input.keyboard.on('keydown-ENTER', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-SPACE', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-LEFT',  () => { this.selectedLevel = Math.max(0, this.selectedLevel - 1);                 this._drawLevels(); audio.playMenuBeep(330) })
    this.input.keyboard.on('keydown-RIGHT', () => { this.selectedLevel = Math.min(LEVELS.length - 1, this.selectedLevel + 1); this._drawLevels(); audio.playMenuBeep(370) })
  }

  _drawLevels() {
    if (this._levelContainer) this._levelContainer.destroy()
    this._levelContainer = this.add.container(0, 0)

    const W    = this.scale.width
    const bw   = this._bw, bh = this._bh, cols = this._cols
    const nameFs = this._nameFs, subFs = this._subFs
    const gapX = this._gapX, gapY = this._gapY

    // Guard: if _build() hasn't run yet, bail silently
    if (!bw || !cols) return

    const totalW = cols * bw + (cols - 1) * gapX
    const sx     = (W - totalW) / 2

    LEVELS.forEach((lv, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const bx  = sx + col * (bw + gapX)
      const by  = this._levelY + row * (bh + gapY)
      const sel = i === this.selectedLevel

      const box = this.add.rectangle(bx, by, bw, bh, sel ? 0x0c1030 : 0x060810)
        .setOrigin(0)
        .setStrokeStyle(sel ? 2 : 0.5, sel ? 0xf5e642 : 0x181840)
        .setInteractive({ useHandCursor: true })
      box.on('pointerdown', () => { this.selectedLevel = i; this._drawLevels(); audio.playMenuBeep(440) })

      const name = this.add.text(bx + bw / 2, by + bh * 0.26, lv.name, {
        fontFamily: "'Press Start 2P'", fontSize: nameFs + 'px',
        color: sel ? '#f5e642' : '#6666aa',
      }).setOrigin(0.5)

      const sub = this.add.text(bx + bw / 2, by + bh * 0.68, lv.subtitle, {
        fontFamily: "'Press Start 2P'", fontSize: subFs + 'px',
        color: sel ? '#9999cc' : '#2a2a55', wordWrap: { width: bw - 8 },
      }).setOrigin(0.5)

      this._levelContainer.add([box, name, sub])
    })
  }

  _updateCursor() {
    if (!this.menuTexts?.length) return
    const x = this.scale.width / 2 - this.menuTexts[0].width / 2 - this._menuSize - 4
    this._cursorTxt.setPosition(x, this._menuTopY + this.menuIndex * this._menuGap)
    this.menuTexts.forEach((t, i) => t.setColor(i === this.menuIndex ? '#f5e642' : '#666688'))
  }

  _start() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
    const panel   = document.getElementById('arcade-panel')
    if (panel && isTouch) panel.style.display = 'block'
    else if (panel)       panel.style.display = 'none'
    // Resize canvas to account for panel height change before scene starts
    if (window._sk8_resizeGame) window._sk8_resizeGame()
    this.scene.start('GameScene', { levelId: LEVELS[this.selectedLevel].id })
    this.scene.launch('HUDScene')
  }
}
