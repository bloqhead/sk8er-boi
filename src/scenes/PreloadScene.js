import { SpriteFactory } from '../systems/SpriteFactory.js'
import { Leaderboard } from '../data/leaderboard.js'
import { LEVELS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene') }

  create() {
    const S = 2  // UI pixel scale (smaller since canvas is fixed 480×270)

    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0a0a0f).setOrigin(0)

    // Title
    const title = this.add.text(GAME_W / 2, GAME_H * 0.28, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize: '18px',
      color: '#f5e642',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title, y: GAME_H * 0.28 - 3,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut'
    })

    this.add.text(GAME_W / 2, GAME_H * 0.48, 'LOADING...', {
      fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#00f5ff'
    }).setOrigin(0.5)

    // Progress bar
    const barW = GAME_W * 0.55
    this.add.rectangle(GAME_W / 2, GAME_H * 0.60, barW + 4, 10, 0x222222).setOrigin(0.5)
    const barBg = this.add.rectangle(GAME_W / 2 - barW / 2, GAME_H * 0.60, 0, 8, 0x39ff14).setOrigin(0, 0.5)

    const factory = new SpriteFactory(this)

    const tasks = [
      // Skater — one spritesheet covers all animation frames
      () => factory.createSkaterSheet('skater'),

      // Obstacles
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

      // Ramps and rails per level
      ...LEVELS.map(lv => () => factory.createRamp(`ramp_${lv.id}`)),
      ...LEVELS.map(lv => () => factory.createRail(`rail_${lv.id}`)),

      // UI
      () => factory.createHeart('heart_full',  true),
      () => factory.createHeart('heart_empty', false),
      () => factory.createStar('star'),

      // Particles
      () => factory.createParticle('particle_white',  '#ffffff', 2),
      () => factory.createParticle('particle_yellow', '#f5e642', 2),
      () => factory.createParticle('particle_pink',   '#ff2d78', 2),
      () => factory.createParticle('particle_cyan',   '#00f5ff', 2),
      () => factory.createSparkle('sparkle_yellow', '#f5e642'),
    ]

    let i = 0
    const doNext = () => {
      if (i >= tasks.length) {
        barBg.width = barW
        Leaderboard.seedWithDemoData()
        const ready = this.add.text(GAME_W / 2, GAME_H * 0.76, 'PRESS ANY KEY', {
          fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#f5e642'
        }).setOrigin(0.5)
        this.tweens.add({ targets: ready, alpha: 0, duration: 400, yoyo: true, repeat: -1 })
        this.input.keyboard.once('keydown', () => this.scene.start('MenuScene'))
        this.input.once('pointerdown', () => this.scene.start('MenuScene'))
        return
      }
      try { tasks[i]() } catch (e) { console.warn('Sprite gen:', e) }
      i++
      barBg.width = (i / tasks.length) * barW
      this.time.delayedCall(6, doNext)
    }
    this.time.delayedCall(200, doNext)
  }
}
