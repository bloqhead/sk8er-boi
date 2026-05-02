export const LEVELS = [
  {
    id: 1,
    name: 'DOWNTOWN',
    subtitle: 'Street Hustle',
    bgColors: {
      sky: [0x1a0533, 0x2d0b5c, 0x0d1b3e],
      ground: [0x2a2a3a, 0x1f1f2e],
      accent: 0xff2d78
    },
    buildingColors: [0x1a1a2e, 0x16213e, 0x0f3460, 0x1a0533],
    windowColor: 0xf5e642,
    speed: 220,
    maxSpeed: 380,
    obstacles: ['trash_can', 'pigeon', 'person_standing', 'curb', 'stairs', 'newspaper_box', 'child'],
    rampFrequency: 0.15,
    railFrequency: 0.1,
    obstacleFrequency: 0.7,
    music: 'downtown_theme'
  },
  {
    id: 2,
    name: 'SUBURBIA',
    subtitle: 'Cul-de-sac Chaos',
    bgColors: {
      sky: [0x0d2137, 0x1a3a5c, 0x0a1628],
      ground: [0x2d4a1e, 0x1f3314],
      accent: 0x39ff14
    },
    buildingColors: [0x3d2b1f, 0x4a3728, 0x2d1f12, 0x3a2a1a],
    windowColor: 0x00f5ff,
    speed: 250,
    maxSpeed: 420,
    obstacles: ['trash_can', 'dog', 'mailbox', 'fire_hydrant', 'lawn_gnome', 'person_walking', 'child', 'stairs'],
    rampFrequency: 0.2,
    railFrequency: 0.12,
    obstacleFrequency: 0.75,
    music: 'suburbia_theme'
  },
  {
    id: 3,
    name: 'INDUSTRIAL',
    subtitle: 'Pipe Dreams',
    bgColors: {
      sky: [0x0a0a0a, 0x1a1a1a, 0x0f0f0f],
      ground: [0x3a2a1a, 0x2a1a0a],
      accent: 0x00f5ff
    },
    buildingColors: [0x2a2a2a, 0x1a1a1a, 0x333333, 0x222222],
    windowColor: 0xff6600,
    speed: 280,
    maxSpeed: 460,
    obstacles: ['barrel', 'forklift_wheel', 'pipe', 'worker', 'cone', 'dog'],
    rampFrequency: 0.25,
    railFrequency: 0.2,
    obstacleFrequency: 0.8,
    music: 'industrial_theme'
  },
  {
    id: 4,
    name: 'NEON CITY',
    subtitle: 'Midnight Run',
    bgColors: {
      sky: [0x050010, 0x0d0020, 0x030008],
      ground: [0x1a0030, 0x0d0020],
      accent: 0xf5e642
    },
    buildingColors: [0x0d0020, 0x1a0033, 0x0a001a, 0x15002a],
    windowColor: 0xff00ff,
    speed: 310,
    maxSpeed: 500,
    obstacles: ['trash_can', 'neon_sign', 'scooter', 'person_standing', 'dog', 'cone', 'person_walking'],
    rampFrequency: 0.3,
    railFrequency: 0.25,
    obstacleFrequency: 0.85,
    music: 'neon_theme'
  }
]

export const GAME_CONSTANTS = {
  PLAYER_START_X:   80,
  GROUND_HEIGHT:    40,
  PIXEL_SCALE:      3,
  SPRITE_SIZE:      12,
  JUMP_POWER_MIN:   -380,
  JUMP_POWER_MAX:   -680,
  JUMP_CHARGE_TIME: 550,
  SPEED_INCREMENT:  25,
  SCORE_PER_METER:  1,
  SCORE_OLLIE:      30,
  SCORE_TRICK:      100,
  SCORE_RAIL:       150,
  LIVES:            3,
  INVINCIBLE_TIME:  1400
}

export const OBSTACLES = {
  trash_can:       { w: 20, h: 28, color: 0x888888, label: 'TRASH CAN' },
  pigeon:          { w: 16, h: 12, color: 0xaaaaaa, label: 'PIGEON',     flying: true },
  person_standing: { w: 16, h: 36, color: 0x4444ff, label: 'PEDESTRIAN' },
  person_walking:  { w: 16, h: 36, color: 0xff4444, label: 'WALKER' },
  child:           { w: 12, h: 24, color: 0xff9900, label: 'KID ON BIKE' },
  curb:            { w: 32, h: 12, color: 0xcccccc, label: 'CURB' },
  stairs:          { w: 48, h: 32, color: 0xbbbbbb, label: 'STAIRS' },
  newspaper_box:   { w: 20, h: 24, color: 0x3366cc, label: 'NEWS BOX' },
  dog:             { w: 24, h: 16, color: 0xc8860a, label: 'DOG' },
  mailbox:         { w: 18, h: 28, color: 0x3355cc, label: 'MAILBOX' },
  fire_hydrant:    { w: 16, h: 24, color: 0xdd2222, label: 'HYDRANT' },
  lawn_gnome:      { w: 14, h: 20, color: 0xcc3333, label: 'GNOME' },
  barrel:          { w: 24, h: 28, color: 0x553300, label: 'BARREL' },
  pipe:            { w: 20, h: 20, color: 0x777777, label: 'PIPE' },
  worker:          { w: 16, h: 36, color: 0xffaa00, label: 'WORKER' },
  cone:            { w: 16, h: 20, color: 0xff6600, label: 'CONE' },
  neon_sign:       { w: 48, h: 12, color: 0xff00ff, label: 'SIGN',       low: true },
  scooter:         { w: 32, h: 20, color: 0x00ccff, label: 'SCOOTER' },
  forklift_wheel:  { w: 28, h: 28, color: 0x555555, label: 'WHEEL' }
}
