export const LEVELS = [
  {
    id: 1,
    name: 'DOWNTOWN',
    subtitle: 'Street Hustle',
    bgColors: {
      sky:    [0x0d0525, 0x160a45, 0x0a1060],  // deep indigo-blue night
      ground: [0x1a1a26, 0x242434],
      accent: 0xff2d78
    },
    // Steel-blue/slate buildings — clearly distinct from warm amber obstacles
    // Much lighter than the sky so silhouettes read crisply
    buildingColors: [0x1e2d52, 0x243362, 0x192548, 0x1b2a4a, 0x203058],
    windowColor: 0xf5e642,
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
      sky:    [0x87ceeb, 0x5ba3d9, 0x3a7fbf],
      ground: [0x4a7c2f, 0x3a6020],
      accent: 0x39ff14
    },
    // Warm house colors — cream/sand/terracotta, triangular roofs added in code
    buildingColors: [0xd4b896, 0xc8a882, 0xe0c4a4, 0xbca080, 0xd8bc98],
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
      sky:    [0x0e0a04, 0x1c1508, 0x120e04],  // very dark warm amber-black
      ground: [0x1e180a, 0x140e04],
      accent: 0x00f5ff
    },
    // Darker teal-green industrial blocks — contrast with orange/amber obstacles
    buildingColors: [0x0a2828, 0x0c3030, 0x0e3838, 0x083222, 0x0a2c2c],
    windowColor: 0xff8800,
    groundStripeColor: 0xff6600,
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
      sky:    [0x000208, 0x000412, 0x00010a],  // near-black blue
      ground: [0x080010, 0x040008],
      accent: 0xf5e642
    },
    // Deep navy/indigo — lighter than sky so silhouettes visible,
    // neon signs baked in give them personality
    buildingColors: [0x080f28, 0x0a1232, 0x060c22, 0x091030, 0x070e26],
    windowColor: 0xff00ff,
    groundStripeColor: 0x6600ff,
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
