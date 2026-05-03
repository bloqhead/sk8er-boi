import { Leaderboard } from '../data/leaderboard.js'
import { layout }      from '../systems/Layout.js'
import { audio }       from '../audio/AudioManager.js'

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene') }

  create() {
    // Hide arcade panel on non-game screens
    const _p = document.getElementById('arcade-panel'); if (_p) _p.style.display = 'none'; if (window._sk8_resizeGame) window._sk8_resizeGame()
    this._build()
    this.scale.on('resize', () => { this.children.removeAll(true); this._build() })
  }

  _build() {
    const L = layout(this)
    const { W, H, u, font } = L

    this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0)
    for (let i = 0; i < 60; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.2 + 0.04)
      g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1)
    }

    this.add.text(W / 2, H * 0.05, 'HIGH SCORES', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      '#f5e642',
      stroke:     '#000',
      strokeThickness: Math.max(3, font.xl * 0.22),
    }).setOrigin(0.5)

    // Column headers
    const headerY = H * 0.17
    const cols = [
      { xF: 0.05, t: '#' },
      { xF: 0.18, t: 'NAME' },
      { xF: 0.44, t: 'SCORE' },
      { xF: 0.68, t: 'TRK' },
      { xF: 0.86, t: 'DATE' },
    ]
    cols.forEach(c => {
      this.add.text(W * c.xF, headerY, c.t, {
        fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#00f5ff',
      })
    })
    this.add.rectangle(0, headerY + font.xs + 2, W, 1, 0x222244).setOrigin(0)

    const entries   = Leaderboard.getTopN(10)
    const rankColors = ['#f5e642', '#cccccc', '#cd7f32']
    const listH     = H * 0.58
    const rowH      = Math.min(listH / Math.max(entries.length, 1), H * 0.072)
    const listY     = headerY + font.xs + 6

    entries.forEach((e, i) => {
      const ry = listY + i * rowH
      const rc = rankColors[i] || '#777777'
      if (i % 2 === 0) this.add.rectangle(W / 2, ry + rowH / 2, W - u, rowH - 1, 0x0d0d22, 0.4)
      this.add.text(W * 0.05, ry + 2, String(i + 1), { fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: rc })
      this.add.text(W * 0.18, ry + 2, e.initials, { fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: rc })
      this.add.text(W * 0.44, ry + 2, e.score.toLocaleString(), { fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#fff' })
      this.add.text(W * 0.68, ry + 2, String(e.tricks || 0), { fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#888' })
      this.add.text(W * 0.86, ry + 2, (e.date || '').slice(5), { fontFamily: "'Press Start 2P'", fontSize: font.xs - 1 + 'px', color: '#555' })
    })

    if (!entries.length) {
      this.add.text(W / 2, H * 0.5, 'NO SCORES YET!\nBE THE FIRST!', {
        fontFamily: "'Press Start 2P'", fontSize: font.md + 'px', color: '#444', align: 'center',
      }).setOrigin(0.5)
    }

    this.add.rectangle(0, H * 0.88, W, 1, 0x222244).setOrigin(0)

    const btnY = H * 0.93
    const btnFontSize = font.md + 'px'

    const back = this.add.text(W * 0.28, btnY, '◄ MENU', {
      fontFamily: "'Press Start 2P'", fontSize: btnFontSize, color: '#ff2d78',
      backgroundColor: '#110000', padding: { x: u * 0.5, y: u * 0.3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#fff'))
    back.on('pointerout',  () => back.setColor('#ff2d78'))
    back.on('pointerdown', () => { audio.playMenuBeep(330); this.scene.start('MenuScene') })

    const play = this.add.text(W * 0.72, btnY, 'PLAY ►', {
      fontFamily: "'Press Start 2P'", fontSize: btnFontSize, color: '#39ff14',
      backgroundColor: '#001100', padding: { x: u * 0.5, y: u * 0.3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    play.on('pointerover', () => play.setColor('#fff'))
    play.on('pointerout',  () => play.setColor('#39ff14'))
    play.on('pointerdown', () => { audio.playMenuBeep(440); this.scene.start('MenuScene') })

    // Invisible clear zone (tiny, bottom-right)
    const clr = this.add.text(W - 2, H - 2, 'CLR', {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#1a1a2e',
    }).setOrigin(1, 1).setInteractive()
    clr.on('pointerdown', () => { Leaderboard.clear(); this.scene.restart() })

    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown-ESC',   () => this.scene.start('MenuScene'))
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'))
  }
}
