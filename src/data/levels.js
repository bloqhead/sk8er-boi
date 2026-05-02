export const LEVELS = [
  {
    id: 1,
    name: 'DOWNTOWN',
    subtitle: 'Street Hustle',
    bgColors: {
      sky:    [0x0a0318, 0x1a0840, 0x0d1255],  // deep purple-blue night
      ground: [0x1e1e28, 0x2a2a38],
      accent: 0xff2d78
    },
    // Warm amber/terracotta buildings — clearly distinct from dark obstacles
    buildingColors: [0x3d2408, 0x5c3510, 0x472c0c, 0x6b3d12, 0x382008],
    windowColor: 0xf5e642,
    // Bright stripe at ground level so the road reads cleanly
    groundStripeColor: 0xffdd44,
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
      sky:    [0x87ceeb, 0x5ba3d9, 0x3a7fbf],  // bright daytime sky blue
      ground: [0x4a7c2f, 0x3a6020],             // green grass
      accent: 0x39ff14
    },
    // Warm pastel house colors — reads clearly against blue sky
    buildingColors: [0xd4956a, 0xc4845a, 0xe8b88a, 0xb87048, 0xcc9070],
    windowColor: 0x88ddff,
    groundStripeColor: 0x6aaa3f,
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
      sky:    [0x1a1208, 0x2a1e0e, 0x100c04],  // dark amber smoggy sky
      ground: [0x2a2010, 0x1e1808],
      accent: 0x00f5ff
    },
    // Teal/steel-blue industrial buildings — pops against amber sky + dark ground
    buildingColors: [0x1a4040, 0x0f3535, 0x245050, 0x1c4848, 0x102e2e],
    windowColor: 0xff6600,
    groundStripeColor: 0xff8800,
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
      sky:    [0x000510, 0x000820, 0x000308],  // very deep near-black
      ground: [0x0a0018, 0x060010],
      accent: 0xf5e642
    },
    // Deep teal/indigo buildings with neon trim — obstacles pop as bright colors
    buildingColors: [0x060a2a, 0x040820, 0x080c30, 0x050924, 0x060b28],
    windowColor: 0xff00ff,
    groundStripeColor: 0x8800ff,
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
