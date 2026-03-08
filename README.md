# 🎮 SkyRoll Adventure

A high-quality 3D browser ball-rolling game built with Three.js. Navigate a rolling ball across floating sky platforms, avoid obstacles, collect coins, and reach the finish portal!

## 🎯 Game Overview

**SkyRoll Adventure** is an addictive ball-balancing platformer inspired by Extreme Balancer 3. Players control a rolling ball traveling across floating platforms in the sky, navigating through increasingly difficult levels with obstacles, gaps, and collectibles.

## ✅ Completed Features

### Core Gameplay
- **Ball physics**: Realistic rolling, jumping, gravity, friction, and momentum
- **100 procedural levels**: Uniquely generated layouts using seeded randomization
- **5 difficulty tiers**: Easy (1-25), Medium (26-50), Hard (51-75), Extreme (76-100)
- **Multiple platform types**: Static, moving, falling, narrow, zigzag, elevated
- **Checkpoint system**: Respawn at activated checkpoints after falling
- **Jump mechanics**: Space bar / mobile button to jump gaps

### Obstacles (8 types)
- 🔺 **Spikes** - Static ground hazards
- 🔄 **Rotating Saw Blades** - Spinning circular saws
- 🧱 **Moving Walls** - Side-to-side oscillating barriers
- 💨 **Wind Zones** - Push the ball with wind force
- 🔴 **Laser Barriers** - Toggling laser beams between poles
- 🔨 **Swinging Hammers** - Pendulum-style swinging obstacles
- 📦 **Falling Platforms** - Collapse after standing on them
- 🌀 **Rotating Bridges** - Spinning walkways (extreme only)

### Environments (5 themes)
| Theme | Levels | Description |
|-------|--------|-------------|
| ☁️ Sky Islands | 1-20 | Bright blue sky, wooden bridges, clouds |
| 🌊 Ocean Bridges | 21-40 | Deep ocean, weathered platforms |
| 🌋 Lava World | 41-60 | Dark volcanic, molten lava below |
| ❄️ Snow Mountains | 61-80 | Icy peaks, cold atmosphere |
| 🌃 Neon City | 81-100 | Cyberpunk neon glow, dark city |

### Game Modes (4 modes)
- **Normal Mode**: Play through 100 levels progressively
- **Time Attack**: Race against the clock for best times
- **Daily Challenge**: Unique level every day with bonus rewards
- **Endless Survival**: Infinite procedural segments, how far can you go?

### Scoring & Stars
- ⭐ 1 Star: Level completed
- ⭐⭐ 2 Stars: Completed under par time
- ⭐⭐⭐ 3 Stars: Fast completion + 80%+ coins collected
- Score based on: coins collected, time taken, bonuses

### Collectibles & Economy
- 🪙 **Coins** scattered across levels with particle glow effects
- Coin collection with sound effects
- Score popup animations (+100 per coin)
- Coins used to purchase ball skins

### Ball Customization Shop (8 skins)
| Skin | Price | Description |
|------|-------|-------------|
| 🟤 Wooden Ball | Free | Classic wooden starter ball |
| ⚙️ Metal Ball | 200 | Shiny metallic sphere |
| 💚 Neon Ball | 350 | Glowing neon green sphere |
| 💎 Crystal Ball | 500 | Transparent crystal |
| 🔥 Fire Ball | 600 | Blazing hot sphere |
| ✨ Gold Ball | 800 | Luxurious gold sphere |
| 🌌 Galaxy Ball | 1000 | Cosmic purple sphere |
| 🧊 Ice Ball | 750 | Frozen ice sphere |

### Achievements (13 achievements)
- First Step, Getting Started, Halfway There, Master Roller
- Perfectionist, Coin Collector, Rich Roller, Never Give Up
- Speed Demon, Sky Explorer, Ocean Voyager, Lava Survivor, World Traveler
- Each achievement awards bonus coins

### Player Retention Features
- 🎁 **Daily Rewards**: Login daily for increasing coin rewards (streak system)
- 🏆 **Achievement System**: 13 unlockable achievements with coin rewards
- 📊 **Star Rating**: 3-star system encourages replaying levels
- 🏅 **Best Scores/Times**: Tracks personal bests per level
- ♾️ **Endless Mode**: High score competition

### UI System
- **Main Menu** with animated particle background
- **Level Select** with environment tabs and star display
- **Settings**: Music, SFX, Quality (Low/Medium/High), Camera Sensitivity, FPS Counter
- **Pause Menu** with resume/restart/quit
- **Victory Screen** with animated stars and stats
- **Game Over Screen** with retry option
- **Toast Notifications** for achievements, checkpoints, etc.
- **HUD**: Level, Coins, Timer, Lives (hearts), Pause button

### Audio System (Procedural Web Audio API)
- 🎵 Background music (ambient chord progressions per environment)
- 🪙 Coin collection sound
- 🦘 Jump sound effect
- 💀 Fall/death sound
- 🎉 Victory fanfare
- 💥 Obstacle hit sound
- 🏁 Checkpoint activation sound
- 🖱️ Button click sound

### Controls
**Desktop:**
| Key | Action |
|-----|--------|
| W / ↑ | Move Forward |
| S / ↓ | Move Backward |
| A / ← | Move Left |
| D / → | Move Right |
| Space | Jump |
| R | Restart Level |
| Esc | Pause |

**Mobile/Tablet:**
- On-screen touch buttons (directional + jump)
- Auto-detected on touch devices

### Save System (localStorage)
- Unlocked levels, star ratings, best times, best scores
- Coins balance, owned skins, equipped skin
- Achievement progress, daily reward streak
- Total play statistics (deaths, completions, etc.)
- Settings preferences

### Graphics & Performance
- **Three.js WebGL** rendering with PBR materials
- **Dynamic shadows** (quality-dependent)
- **Fog effects** per environment
- **Particle effects** (coins, lava, portal)
- **ACES Filmic tone mapping**
- **3 quality presets**: Low (no shadows, 1x pixel ratio), Medium, High (PCFSoft shadows, 2x)
- **FPS counter** (toggleable)
- Adaptive pixel ratio for mobile performance

## 📁 Project Structure

```
index.html          - Main HTML with all screen layouts
css/
  style.css         - Complete UI styling (responsive)
js/
  main.js           - Entry point, loading, game loop
  engine.js         - Core 3D game engine (Three.js)
  physics.js        - Ball physics, collision detection
  levels.js         - Procedural level generation (100 levels)
  obstacles.js      - Obstacle creation and behavior
  ui.js             - UI management, menus, HUD
  audio.js          - Procedural audio (Web Audio API)
  save.js           - localStorage save/load system
```

## 🔗 Entry URI

- **Main Game**: `index.html` — Loads directly to the main menu

## 🛠️ Technology Stack

- **Three.js** (v0.160.0) — 3D WebGL rendering
- **Web Audio API** — Procedural sound effects and music
- **localStorage** — Client-side save system
- **CSS3** — Animations, transitions, responsive layout
- **Font Awesome 6** — UI icons
- **Google Fonts** — Orbitron + Rajdhani typography

## 📱 Device Support

- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Android Chrome)
- ✅ Tablet browsers
- ✅ Touch controls auto-detected

## 🚀 Recommended Next Steps

1. **Leaderboard integration** — Add online leaderboards via REST API
2. **More obstacle variations** — Conveyor belts, teleporters, gravity flippers
3. **Multiplayer mode** — Real-time or ghost race competition
4. **Custom level editor** — Let players create and share levels
5. **Particle system enhancement** — Trail effects behind the ball
6. **Music tracks** — Load real audio files for richer background music
7. **Tutorial level** — Interactive tutorial for new players
8. **Social sharing** — Share scores to social media
