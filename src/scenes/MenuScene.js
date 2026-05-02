import { audio } from '../audio/AudioManager.js'
import { LEVELS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
    this.selectedLevel = 0
    this.menuIndex     = 0
  }

  create() {
    const gw = GAME_W, gh = GAME_H
    audio.resume()

    // Sky gradient background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0d1b3e, 0x0d1b3e, 1)
    bg.fillRect(0, 0, gw, gh)

    // Stars
    for (let i = 0; i < 60; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.5 + 0.1)
      g.fillRect(Math.floor(Math.random() * gw), Math.floor(Math.random() * gh * 0.7), 1, 1)
    }

    // Ground strip
    this.add.rectangle(0, gh - 40, gw, 40, 0x1a1a2e).setOrigin(0)
    this.add.rectangle(0, gh - 40, gw, 2,  0x333355).setOrigin(0)

    // Title
    const title = this.add.text(gw / 2, gh * 0.14, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'", fontSize: '22px', color: '#f5e642',
      stroke: '#000000', strokeThickness: 5,
      shadow: { offsetX: 3, offsetY: 3, color: '#ff2d78', blur: 0, fill: true }
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title, y: gh * 0.14 - 2,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut'
    })

    this.add.text(gw / 2, gh * 0.25, '"SKATE OR BAIL"', {
      fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#ff2d78'
    }).setOrigin(0.5)

    // Idle skater sprite
    const skater = this.add.image(gw / 2, gh * 0.38, 'skater', 'roll_a')
    this.tweens.add({
      targets: skater, y: gh * 0.38 - 3,
      duration: 350, yoyo: true, repeat: -1, ease: 'Bounce.Out'
    })
    // Bob between frames
    this.time.addEvent({ delay: 180, loop: true, callback: () => {
      const f = skater.frame.name === 'roll_a' ? 'roll_b' : 'roll_a'
      skater.setFrame(f)
    }})

    // Level select
    this.add.text(gw / 2, gh * 0.50, 'SELECT LEVEL', {
      fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#00f5ff'
    }).setOrigin(0.5)

    this._levelContainer = null
    this._drawLevels()

    // Menu items
    const items = [
      { label: 'START GAME',  action: () => this._start() },
      { label: 'LEADERBOARD', action: () => this.scene.start('LeaderboardScene') }
    ]
    this.menuTexts = items.map((item, i) => {
      const t = this.add.text(gw / 2, gh * 0.76 + i * 16, item.label, {
        fontFamily: "'Press Start 2P'", fontSize: '7px',
        color: i === this.menuIndex ? '#f5e642' : '#666666'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      t.on('pointerover', () => { this.menuIndex = i; this._updateCursor(); audio.playMenuBeep(440) })
      t.on('pointerdown', () => { audio.playMenuBeep(660); item.action() })
      return t
    })

    this._cursorTxt = this.add.text(0, 0, '▶', {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#f5e642'
    })
    this._updateCursor()

    // Controls hint
    this.add.text(gw / 2, gh - 6, '← → SPEED   ↑/SPACE OLLIE', {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#333355'
    }).setOrigin(0.5, 1)

    // Keyboard
    this.input.keyboard.on('keydown-UP',    () => { this.menuIndex = Math.max(0, this.menuIndex-1); this._updateCursor(); audio.playMenuBeep(400) })
    this.input.keyboard.on('keydown-DOWN',  () => { this.menuIndex = Math.min(items.length-1, this.menuIndex+1); this._updateCursor(); audio.playMenuBeep(400) })
    this.input.keyboard.on('keydown-ENTER', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-SPACE', () => { audio.playMenuBeep(660); items[this.menuIndex].action() })
    this.input.keyboard.on('keydown-LEFT',  () => { this.selectedLevel = Math.max(0, this.selectedLevel-1); this._drawLevels(); audio.playMenuBeep(330) })
    this.input.keyboard.on('keydown-RIGHT', () => { this.selectedLevel = Math.min(LEVELS.length-1, this.selectedLevel+1); this._drawLevels(); audio.playMenuBeep(370) })
  }

  _drawLevels() {
    if (this._levelContainer) this._levelContainer.destroy()
    this._levelContainer = this.add.container(0, 0)

    const gw = GAME_W, gh = GAME_H
    const levels = LEVELS
    const bw = Math.floor((gw - 20) / levels.length) - 3
    const bh = 24
    const totalW = levels.length * (bw + 3) - 3
    const sx = (gw - totalW) / 2

    levels.forEach((lv, i) => {
      const bx = sx + i * (bw + 3)
      const by = gh * 0.56
      const sel = i === this.selectedLevel

      const box = this.add.rectangle(bx, by, bw, bh, sel ? 0x111133 : 0x0a0a1a)
        .setOrigin(0).setStrokeStyle(sel ? 1.5 : 0.5, sel ? 0xf5e642 : 0x333366)
        .setInteractive({ useHandCursor: true })
      box.on('pointerdown', () => { this.selectedLevel = i; this._drawLevels(); audio.playMenuBeep(440) })

      const name = this.add.text(bx + bw/2, by + 7, lv.name, {
        fontFamily: "'Press Start 2P'", fontSize: '4px',
        color: sel ? '#f5e642' : '#666666', wordWrap: { width: bw - 4 }
      }).setOrigin(0.5, 0)

      const sub = this.add.text(bx + bw/2, by + 15, lv.subtitle, {
        fontFamily: "'Press Start 2P'", fontSize: '3px',
        color: sel ? '#aaaaaa' : '#444444', wordWrap: { width: bw - 4 }
      }).setOrigin(0.5, 0)

      this._levelContainer.add([box, name, sub])
    })
  }

  _updateCursor() {
    const gw = GAME_W, gh = GAME_H
    this._cursorTxt.setPosition(gw / 2 - 72, gh * 0.76 + this.menuIndex * 16 - 1)
    this.menuTexts.forEach((t, i) => t.setColor(i === this.menuIndex ? '#f5e642' : '#666666'))
  }

  _start() {
    this.scene.start('GameScene', { levelId: LEVELS[this.selectedLevel].id })
    this.scene.launch('HUDScene')
  }
}
