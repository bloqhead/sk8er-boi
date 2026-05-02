# 🛹 SK8ER BOI

> *"Skate or Bail"* — An endless pixel-art side-scrolling skateboarding game

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🎮 Play

Clone the repo, install, and go:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start shredding.

### Build for production

```bash
npm run build
npm run preview
```

---

## 🕹️ Controls

### Keyboard (Desktop)

| Key | Action |
|-----|--------|
| `↑` / `Space` | Hold to charge Ollie, release to launch |
| `→` | Speed up |
| `←` | Slow down |
| `Shift` | (Trick modifier — in progress) |

### Touch (Mobile)

On-screen buttons appear automatically on mobile:
- **◄** — Slow down
- **▲** — Jump / Ollie (tap & hold for power)
- **►** — Speed up

---

## 🏙️ Levels

| Level | Location | Vibe |
|-------|----------|------|
| 1 | **Downtown** | Neon-lit streets, pigeons, newspaper boxes |
| 2 | **Suburbia** | Cul-de-sac chaos, dogs, mailboxes |
| 3 | **Industrial** | Pipes, barrels, workers |
| 4 | **Neon City** | Midnight cyberpunk, max speed |

---

## 🛠️ Tech Stack

- **[Phaser 3](https://phaser.io/)** — Game engine (physics, scenes, input)
- **[Vite](https://vitejs.dev/)** — Dev server & bundler
- **Web Audio API** — Procedural 8-bit sound effects (no audio files needed)
- **Canvas API** — All pixel art generated procedurally at startup
- **localStorage** — Leaderboard persistence (no backend required)
- **Press Start 2P** — Pixel font via Google Fonts

---

## 🎨 Features

- ✅ Endless scrolling with 4 distinct levels
- ✅ Charge-based Ollie system (hold for power)
- ✅ Ramp launches with boost
- ✅ Rail grinding
- ✅ Mid-air tricks (kickflip, heelflip, etc.)
- ✅ Combo system
- ✅ Parallax pixel-art city backgrounds (procedural)
- ✅ Particle effects (sparks, smoke, crash explosion)
- ✅ Procedural 8-bit sound effects
- ✅ 3-letter initial leaderboard (localStorage)
- ✅ 3 lives system with invincibility frames
- ✅ Mobile on-screen controls
- ✅ Fully resizable / fullscreen

---

## 🗺️ Roadmap

- [ ] Power-ups (speed boost, shield, magnet)
- [ ] More trick types with manual input combos
- [ ] Custom skater skin selector
- [ ] Online leaderboard (Supabase integration)
- [ ] Boss obstacles at end of each level
- [ ] Day/night cycle per level
- [ ] Replay system

---

## 📁 Project Structure

```
sk8er-boi/
├── src/
│   ├── main.js              # Game config & scene registration
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js  # Procedural sprite generation
│   │   ├── MenuScene.js
│   │   ├── GameScene.js     # Core gameplay loop
│   │   ├── HUDScene.js      # Overlay UI
│   │   ├── GameOverScene.js # Score entry
│   │   ├── LeaderboardScene.js
│   │   └── LevelTransitionScene.js
│   ├── entities/
│   │   └── Player.js        # Skater state machine & physics
│   ├── systems/
│   │   ├── SpriteFactory.js    # Procedural pixel art generator
│   │   ├── BackgroundSystem.js # Parallax city backgrounds
│   │   ├── ObstacleSystem.js   # Obstacle spawning & pooling
│   │   └── ParticleSystem.js   # Effects & text popups
│   ├── audio/
│   │   └── AudioManager.js  # Web Audio API sound effects
│   └── data/
│       ├── levels.js        # Level configs & obstacle definitions
│       └── leaderboard.js   # localStorage leaderboard
├── index.html
├── vite.config.js
└── package.json
```

---

## License

MIT © bloqhead
