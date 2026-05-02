import { audio }   from '../audio/AudioManager.js'
import { LEVELS }  from '../data/levels.js'
import { layout }  from '../systems/Layout.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
    this.selectedLevel = 0
    this.menuIndex     = 0
  }

  create() {
    audio.resume()
    this._build()

    // Rebuild on resize
    this.scale.on('resize', () => {
      this.children.removeAll(true)
      this._build()
    })
  }

  _build() {
    const L = layout(this)
    const { W, H, u, font, isPortrait } = L

    // ── Background ────────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x050510, 0x050510, 0x0d1b3e, 0x0d1b3e, 1)
    bg.fillRect(0, 0, W, H)

    // Stars
    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.5 + 0.1)
      g.fillRect(
        Math.floor(Math.random() * W),
        Math.floor(Math.random() * H * 0.75),
        Math.random() < 0.15 ? 2 : 1,
        Math.random() < 0.15 ? 2 : 1,
      )
    }

    // Ground strip
    this.add.rectangle(0, H - u * 3, W, u * 3, 0x111122).setOrigin(0)
    this.add.rectangle(0, H - u * 3, W, 2, 0x2233aa).setOrigin(0)

    // ── Title ─────────────────────────────────────────────────────────
    const titleY = isPortrait ? H * 0.12 : H * 0.10
    const title = this.add.text(W / 2, titleY, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      '#f5e642',
      stroke:     '#000000',
      strokeThickness: Math.max(3, font.xl * 0.25),
      shadow: { offsetX: 2, offsetY: 2, color: '#ff2d78', blur: 0, fill: true },
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title, y: titleY - u * 0.4,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    this.add.text(W / 2, titleY + font.xl + u * 0.5, '"SKATE OR BAIL"', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    }).setOrigin(0.5)

    // ── Skater sprite ─────────────────────────────────────────────────
    const skaterY  = isPortrait ? H * 0.30 : H * 0.34
    const skaterSc = Math.max(1.5, u * 0.25)
    const skater   = this.add.image(W / 2, skaterY, 'skater', 'roll_a').setScale(skaterSc)
    this.tweens.add({
      targets: skater, y: skaterY - u * 0.5,
      duration: 380, yoyo: true, repeat: -1, ease: 'Bounce.Out',
    })
    this.time.addEvent({ delay: 180, loop: true, callback: () => {
      skater.setFrame(skater.frame.name === 'roll_a' ? 'roll_b' : 'roll_a')
    }})

    // ── Level select ──────────────────────────────────────────────────
    const levelTopY = isPortrait ? H * 0.42 : H * 0.46

    this.add.text(W / 2, levelTopY, 'SELECT LEVEL', {
      fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#00f5ff',
    }).setOrigin(0.5)

    this._levelY = levelTopY + font.sm + u * 0.8
    this._levelContainer = null
    this._drawLevels(L)

    // ── Menu items ────────────────────────────────────────────────────
    const menuTopY = isPortrait ? H * 0.72 : H * 0.74
    const menuGap  = font.md * 2.6

    const items = [
      { label: 'START GAME',  action: () => this._start() },
      { label: 'LEADERBOARD', action: () => this.scene.start('LeaderboardScene') },
    ]

    this.menuTexts = items.map((item, i) => {
      const ty = menuTopY + i * menuGap
      const t = this.add.text(W / 2, ty, item.label, {
        fontFamily: "'Press Start 2P'",
        fontSize:   font.md + 'px',
        color:      i === this.menuIndex ? '#f5e642' : '#888888',
        padding:    { x: u, y: u * 0.6 },
      }).setOrigin(0.5)

      // Large invisible hit zone for easy tapping
      const zone = this.add.rectangle(W / 2, ty, Math.min(W * 0.8, 300), menuGap * 0.9, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => {
        this.menuIndex = i
        this._updateCursor()
        audio.playMenuBeep(440)
      })
      zone.on('pointerdown', () => {
        audio.playMenuBeep(660)
        item.action()
      })
      return t
    })

    // Cursor arrow
    this._cursorTxt = this.add.text(0, 0, '▶', {
      fontFamily: "'Press Start 2P'", fontSize: font.md + 'px', color: '#f5e642',
    })
    this._menuTopY = menuTopY
    this._menuGap  = menuGap
    this._updateCursor()

    // ── Controls hint ─────────────────────────────────────────────────
    this.add.text(W / 2, H - u * 0.8, '← → SPEED   ↑/SPACE OLLIE', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#334',
    }).setOrigin(0.5, 1)

    // ── Keyboard nav ──────────────────────────────────────────────────
    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown-UP', () => {
      this.menuIndex = Math.max(0, this.menuIndex - 1)
      this._updateCursor(); audio.playMenuBeep(400)
    })
    this.input.keyboard.on('keydown-DOWN', () => {
      this.menuIndex = Math.min(items.length - 1, this.menuIndex + 1)
      this._updateCursor(); audio.playMenuBeep(400)
    })
    this.input.keyboard.on('keydown-ENTER', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-SPACE', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-LEFT', () => {
      this.selectedLevel = Math.max(0, this.selectedLevel - 1)
      this._drawLevels(L); audio.playMenuBeep(330)
    })
    this.input.keyboard.on('keydown-RIGHT', () => {
      this.selectedLevel = Math.min(LEVELS.length - 1, this.selectedLevel + 1)
      this._drawLevels(L); audio.playMenuBeep(370)
    })
  }

  _drawLevels(L) {
    if (this._levelContainer) this._levelContainer.destroy()
    this._levelContainer = this.add.container(0, 0)

    const { W, u, font, isPortrait } = L
    const pad   = u * 0.5
    const cols  = isPortrait ? 2 : 4          // 2-col on portrait, 4-col on landscape
    const rows  = Math.ceil(LEVELS.length / cols)
    const bw    = Math.floor((W - u * 2 - pad * (cols - 1)) / cols)
    const bh    = isPortrait ? font.md * 4 : font.md * 3.2
    const gap   = pad
    const totalW = cols * bw + (cols - 1) * gap
    const sx    = (W - totalW) / 2

    LEVELS.forEach((lv, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const bx  = sx + col * (bw + gap)
      const by  = this._levelY + row * (bh + gap)
      const sel = i === this.selectedLevel

      const box = this.add.rectangle(bx, by, bw, bh, sel ? 0x111133 : 0x080818)
        .setOrigin(0)
        .setStrokeStyle(sel ? 2 : 1, sel ? 0xf5e642 : 0x222255)
        .setInteractive({ useHandCursor: true })

      box.on('pointerdown', () => {
        this.selectedLevel = i
        this._drawLevels(L)
        audio.playMenuBeep(440)
      })

      const name = this.add.text(bx + bw / 2, by + bh * 0.3, lv.name, {
        fontFamily: "'Press Start 2P'",
        fontSize:   font.xs + 'px',
        color:      sel ? '#f5e642' : '#888888',
        wordWrap:   { width: bw - u },
      }).setOrigin(0.5)

      const sub = this.add.text(bx + bw / 2, by + bh * 0.65, lv.subtitle, {
        fontFamily: "'Press Start 2P'",
        fontSize:   Math.max(3, font.xs - 1) + 'px',
        color:      sel ? '#aaaaaa' : '#444466',
        wordWrap:   { width: bw - u },
      }).setOrigin(0.5)

      this._levelContainer.add([box, name, sub])
    })
  }

  _updateCursor() {
    const x = this.scale.width / 2 - this.menuTexts[0].width / 2 - 12
    const y = this._menuTopY + this.menuIndex * this._menuGap
    this._cursorTxt.setPosition(x, y)
    this.menuTexts.forEach((t, i) => t.setColor(i === this.menuIndex ? '#f5e642' : '#888888'))
  }

  _start() {
    this.scene.start('GameScene', { levelId: LEVELS[this.selectedLevel].id })
    this.scene.launch('HUDScene')
  }
}
