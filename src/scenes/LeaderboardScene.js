import { Leaderboard } from '../data/leaderboard.js'
import { GAME_W, GAME_H } from '../main.js'
import { audio } from '../audio/AudioManager.js'

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene') }

  create() {
    const gw = GAME_W, gh = GAME_H
    this.add.rectangle(0, 0, gw, gh, 0x0a0a0f).setOrigin(0)
    const g = this.add.graphics()
    for (let i = 0; i < 50; i++) {
      g.fillStyle(0xffffff, Math.random()*0.25+0.05)
      g.fillRect(Math.floor(Math.random()*gw), Math.floor(Math.random()*gh), 1, 1)
    }

    this.add.text(gw/2, 8, 'HIGH SCORES', {
      fontFamily: "'Press Start 2P'", fontSize: '12px', color: '#f5e642',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)

    // Column headers
    const headerY = 30
    const cols = [
      { x: 0.07, t: '#' }, { x: 0.20, t: 'NAME' },
      { x: 0.48, t: 'SCORE' }, { x: 0.70, t: 'TRICKS' }, { x: 0.88, t: 'DATE' }
    ]
    cols.forEach(c => this.add.text(gw*c.x, headerY, c.t, {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#00f5ff'
    }))

    this.add.rectangle(0, headerY+8, gw, 1, 0x333333).setOrigin(0)

    const entries = Leaderboard.getTopN(10)
    const rankColors = ['#f5e642', '#cccccc', '#cd7f32']
    const rowH = Math.min(18, (gh * 0.62) / Math.max(entries.length, 8))

    entries.forEach((e, i) => {
      const ry = headerY + 12 + i * rowH
      const isTop = i < 3
      const rc = rankColors[i] || '#777777'

      if (i % 2 === 0) this.add.rectangle(gw/2, ry+rowH/2-1, gw-8, rowH-1, 0x111122, 0.35)

      this.add.text(gw*0.07, ry, isTop ? `${i+1}` : `${i+1}`, {
        fontFamily: "'Press Start 2P'", fontSize: '4px', color: rc })
      this.add.text(gw*0.20, ry, e.initials, {
        fontFamily: "'Press Start 2P'", fontSize: '6px', color: rc })
      this.add.text(gw*0.48, ry, e.score.toLocaleString(), {
        fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#fff' })
      this.add.text(gw*0.70, ry, String(e.tricks||0), {
        fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#888' })
      this.add.text(gw*0.88, ry, (e.date||'').slice(5), {
        fontFamily: "'Press Start 2P'", fontSize: '3px', color: '#555' })
    })

    if (!entries.length) {
      this.add.text(gw/2, gh/2, 'NO SCORES YET!\nBE THE FIRST!', {
        fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#444', align: 'center'
      }).setOrigin(0.5)
    }

    this.add.rectangle(0, gh-22, gw, 1, 0x222222).setOrigin(0)

    const back = this.add.text(gw*0.28, gh-14, '◄ MENU', {
      fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#ff2d78',
      backgroundColor: '#110000', padding: { x: 3, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#fff'))
    back.on('pointerout',  () => back.setColor('#ff2d78'))
    back.on('pointerdown', () => { audio.playMenuBeep(330); this.scene.start('MenuScene') })

    const play = this.add.text(gw*0.72, gh-14, 'PLAY ►', {
      fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#39ff14',
      backgroundColor: '#001100', padding: { x: 3, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    play.on('pointerover', () => play.setColor('#fff'))
    play.on('pointerout',  () => play.setColor('#39ff14'))
    play.on('pointerdown', () => { audio.playMenuBeep(440); this.scene.start('MenuScene') })

    // tiny clear button
    const clr = this.add.text(gw-3, gh-3, 'CLR', {
      fontFamily: "'Press Start 2P'", fontSize: '3px', color: '#222'
    }).setOrigin(1,1).setInteractive()
    clr.on('pointerdown', () => { Leaderboard.clear(); this.scene.restart() })

    this.input.keyboard.on('keydown-ESC',   () => this.scene.start('MenuScene'))
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'))
  }
}
