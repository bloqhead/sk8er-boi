import { SpriteFactory } from '../systems/SpriteFactory.js'
import { Leaderboard }   from '../data/leaderboard.js'
import { LEVELS }        from '../data/levels.js'
import { layout }        from '../systems/Layout.js'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene') }

  create() {
    const { W, H, font, u } = layout(this)

    this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0)

    const title = this.add.text(W / 2, H * 0.25, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      '#f5e642',
      stroke:     '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title, y: H * 0.25 - u * 0.4,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    this.add.text(W / 2, H * 0.45, 'LOADING...', {
      fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#00f5ff',
    }).setOrigin(0.5)

    const barW = W * 0.6
    const barH = Math.max(6, u * 0.5)
    this.add.rectangle(W / 2, H * 0.58, barW + 4, barH + 4, 0x111111).setOrigin(0.5)
    this.add.rectangle(W / 2, H * 0.58, barW,     barH,     0x222222).setOrigin(0.5)
    const bar = this.add.rectangle(W / 2 - barW / 2, H * 0.58, 0, barH, 0x39ff14).setOrigin(0, 0.5)

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

    let i = 0
    const doNext = () => {
      if (i >= tasks.length) {
        bar.width = barW
        Leaderboard.seedWithDemoData()
        const ready = this.add.text(W / 2, H * 0.72, 'PRESS ANY KEY', {
          fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#f5e642',
        }).setOrigin(0.5)
        this.tweens.add({ targets: ready, alpha: 0, duration: 400, yoyo: true, repeat: -1 })
        this.input.keyboard.once('keydown', () => this.scene.start('MenuScene'))
        this.input.once('pointerdown',      () => this.scene.start('MenuScene'))
        return
      }
      try { tasks[i]() } catch (e) { console.warn('Sprite gen:', e) }
      i++
      bar.width = (i / tasks.length) * barW
      this.time.delayedCall(6, doNext)
    }
    this.time.delayedCall(200, doNext)
  }
}
