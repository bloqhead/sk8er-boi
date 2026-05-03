import { LEVELS } from '../data/levels.js'
import { layout } from '../systems/Layout.js'
import { audio }  from '../audio/AudioManager.js'

export class LevelTransitionScene extends Phaser.Scene {
  constructor() { super('LevelTransitionScene') }

  init(data) {
    this.nextLevelId = data.nextLevelId
    this.score    = data.score    || 0
    this.tricks   = data.tricks   || 0
    this.distance = data.distance || 0
  }

  create() {
    // Hide arcade panel on non-game screens
    const _p = document.getElementById('arcade-panel'); if (_p) _p.style.display = 'none'; if (window._sk8_resizeGame) window._sk8_resizeGame()
    const L = layout(this)
    const { W, H, u, font } = L
    const level = LEVELS.find(l => l.id === this.nextLevelId)
    audio.playLevelUp()

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)

    const title = this.add.text(W / 2, -font.xl * 2, 'LEVEL CLEAR!', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      '#f5e642',
      stroke:     '#000',
      strokeThickness: Math.max(3, font.xl * 0.22),
    }).setOrigin(0.5)
    this.tweens.add({ targets: title, y: H * 0.18, duration: 380, ease: 'Bounce.Out' })

    const stats = [
      { label: 'SCORE',    value: this.score.toLocaleString(), color: '#f5e642' },
      { label: 'TRICKS',   value: this.tricks,                 color: '#00f5ff' },
      { label: 'DISTANCE', value: this.distance + 'm',         color: '#39ff14' },
    ]
    const statGap = font.md * 2.4
    stats.forEach((s, i) => {
      this.time.delayedCall(500 + i * 200, () => {
        const c = this.add.container(W / 2, H * 0.36 + i * statGap)
        c.add([
          this.add.text(-W * 0.30, 0, s.label + ':', {
            fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#888',
          }),
          this.add.text(W * 0.28, 0, String(s.value), {
            fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: s.color,
          }).setOrigin(1, 0),
        ])
        c.setAlpha(0)
        this.tweens.add({ targets: c, alpha: 1, duration: 150 })
        audio.playScoreUp(i + 1)
      })
    })

    if (level) {
      this.time.delayedCall(1600, () => {
        const next = this.add.text(W / 2, H * 0.66, 'NEXT: ' + level.name, {
          fontFamily: "'Press Start 2P'",
          fontSize:   font.lg + 'px',
          color:      '#ff2d78',
          stroke:     '#000',
          strokeThickness: 2,
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({ targets: next, alpha: 1, scaleX: { from: 0.6, to: 1 }, scaleY: { from: 0.6, to: 1 }, duration: 350, ease: 'Back.Out' })

        this.add.text(W / 2, H * 0.78, level.subtitle, {
          fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#555',
        }).setOrigin(0.5).setAlpha(0)
      })
    }

    this.time.delayedCall(3200, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelId: this.nextLevelId })
        this.scene.launch('HUDScene')
      })
    })
  }
}
