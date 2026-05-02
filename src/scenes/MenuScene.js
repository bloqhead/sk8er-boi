import { audio } from '../audio/AudioManager.js'
import { LEVELS } from '../data/levels.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
    this.selectedLevel = 0
    this.menuIndex = 0
  }

  create() {
    const { width, height } = this.scale
    const S = 4
    audio.resume()

    // Background
    this.add.rectangle(0, 0, width, height, 0x0a0a0f).setOrigin(0)

    // Animated background stars
    this._addStars(width, height)

    // Title
    const title = this.add.text(width / 2, height * 0.14, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 9}px`,
      color: '#f5e642',
      stroke: '#000000',
      strokeThickness: S * 3,
      shadow: { offsetX: S * 2, offsetY: S * 2, color: '#ff2d78', blur: 0, fill: true }
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      y: height * 0.14 - S * 2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })

    // Subtitle
    this.add.text(width / 2, height * 0.26, '"SKATE OR BAIL"', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#ff2d78'
    }).setOrigin(0.5)

    // Mini skater sprite
    const skater = this.add.image(width / 2, height * 0.37, 'skater_idle')
      .setScale(1.5)
    this.tweens.add({
      targets: skater,
      y: height * 0.37 - S * 3,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Bounce.Out'
    })

    // Level select
    this.add.text(width / 2, height * 0.5, 'SELECT LEVEL', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 3}px`,
      color: '#00f5ff'
    }).setOrigin(0.5)

    this._drawLevelSelect(width, height, S)

    // Menu options
    const menuItems = [
      { label: 'START GAME', action: () => this._startGame() },
      { label: 'LEADERBOARD', action: () => this.scene.start('LeaderboardScene') }
    ]

    this.menuTexts = menuItems.map((item, i) => {
      const t = this.add.text(width / 2, height * 0.79 + i * S * 7, item.label, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 3}px`,
        color: i === this.menuIndex ? '#f5e642' : '#888888'
      }).setOrigin(0.5)
      t.setInteractive({ useHandCursor: true })
      t.on('pointerover', () => {
        this.menuIndex = i
        this._updateMenuCursor()
        audio.playMenuBeep(440)
      })
      t.on('pointerdown', () => {
        audio.playMenuBeep(660)
        item.action()
      })
      return t
    })

    this._cursor = this.add.text(0, 0, '>', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 3}px`,
      color: '#f5e642'
    })
    this._updateMenuCursor()

    // Controls hint
    this.add.text(width / 2, height * 0.93, '← → CHANGE LEVEL    ↑/SPACE JUMP    ← → SPEED', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 1.2}px`,
      color: '#444'
    }).setOrigin(0.5)

    // Keyboard nav
    this.input.keyboard.on('keydown-UP', () => {
      this.menuIndex = Math.max(0, this.menuIndex - 1)
      this._updateMenuCursor()
      audio.playMenuBeep(400)
    })
    this.input.keyboard.on('keydown-DOWN', () => {
      this.menuIndex = Math.min(menuItems.length - 1, this.menuIndex + 1)
      this._updateMenuCursor()
      audio.playMenuBeep(400)
    })
    this.input.keyboard.on('keydown-ENTER', () => {
      audio.playMenuBeep(660)
      menuItems[this.menuIndex].action()
    })
    this.input.keyboard.on('keydown-SPACE', () => {
      audio.playMenuBeep(660)
      menuItems[this.menuIndex].action()
    })
    this.input.keyboard.on('keydown-LEFT', () => {
      this.selectedLevel = Math.max(0, this.selectedLevel - 1)
      this._drawLevelSelect(width, height, S)
      audio.playMenuBeep(330)
    })
    this.input.keyboard.on('keydown-RIGHT', () => {
      this.selectedLevel = Math.min(LEVELS.length - 1, this.selectedLevel + 1)
      this._drawLevelSelect(width, height, S)
      audio.playMenuBeep(370)
    })
  }

  _addStars(w, h) {
    const g = this.add.graphics()
    g.setDepth(-1)
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w
      const y = Math.random() * h * 0.6
      const size = Math.random() < 0.2 ? 2 : 1
      g.fillStyle(Math.random() > 0.5 ? 0xffffff : 0x9999cc, Math.random() * 0.5 + 0.2)
      g.fillRect(Math.floor(x / 4) * 4, Math.floor(y / 4) * 4, size * 4, size * 4)
    }
  }

  _drawLevelSelect(width, height, S) {
    if (this._levelContainer) this._levelContainer.destroy()
    this._levelContainer = this.add.container(0, 0)

    const levels = LEVELS
    const boxW = Math.min(120, (width - 40) / levels.length)
    const boxH = 60
    const totalW = boxW * levels.length + (levels.length - 1) * S
    const startX = (width - totalW) / 2

    levels.forEach((lv, i) => {
      const bx = startX + i * (boxW + S)
      const by = height * 0.56

      // Box
      const isSelected = i === this.selectedLevel
      const bg = this.add.rectangle(bx, by, boxW, boxH, isSelected ? 0x222244 : 0x111122)
        .setOrigin(0, 0)
        .setStrokeStyle(S / 2, isSelected ? 0xf5e642 : 0x333366)

      // Level name
      const name = this.add.text(bx + boxW / 2, by + 14, lv.name, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: isSelected ? '#f5e642' : '#888888',
        wordWrap: { width: boxW - 8 }
      }).setOrigin(0.5, 0)

      const sub = this.add.text(bx + boxW / 2, by + 35, lv.subtitle, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1}px`,
        color: isSelected ? '#aaaaaa' : '#555555',
        wordWrap: { width: boxW - 8 }
      }).setOrigin(0.5, 0)

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.selectedLevel = i
        this._drawLevelSelect(width, height, S)
        audio.playMenuBeep(440)
      })

      this._levelContainer.add([bg, name, sub])
    })
  }

  _updateMenuCursor() {
    const { width, height } = this.scale
    const S = 4
    this._cursor.setPosition(width / 2 - 100, height * 0.79 + this.menuIndex * S * 7 - S / 2)
    this.menuTexts.forEach((t, i) => {
      t.setColor(i === this.menuIndex ? '#f5e642' : '#888888')
    })
  }

  _startGame() {
    this.scene.start('GameScene', { levelId: LEVELS[this.selectedLevel].id })
    this.scene.launch('HUDScene')
  }
}
