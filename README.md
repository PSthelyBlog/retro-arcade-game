# Retro Arcade Game 🚀👾

A classic **Space Invaders** clone built with vanilla JavaScript and HTML5 Canvas. Features retro pixel-art graphics, 8-bit synthesized sound effects, and smooth 60 FPS gameplay.

> 🤖 **Scaffolded with [goose](https://github.com/block/goose)** using Claude Code's lead/worker multi-agent pattern and the [AGENTS.md](https://agents.md/) standard.

![Game Screenshot](docs/screenshot.png)

## 🎮 Play Now

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## ✨ Features

- 🕹️ **Classic Gameplay**: Authentic Space Invaders mechanics
- 🎮 **Controller Support**: Full gamepad support (Xbox, PlayStation, Nintendo, generic)
- 🎨 **Retro Graphics**: Pixel-art style with CRT scanline effect
- 🔊 **8-Bit Audio**: Synthesized sound effects using Web Audio API
- 📳 **Haptic Feedback**: Controller vibration on shoot and hit events
- 💾 **High Score**: Persistent high score via localStorage
- 📱 **Responsive**: Scales to different screen sizes
- ⚡ **60 FPS**: Smooth gameplay with fixed timestep loop

## 🎯 Controls

### Keyboard

| Key | Action |
|-----|--------|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `Space` | Fire |
| `P` | Pause |
| `M` | Mute/Unmute |
| `R` | Restart (game over) |

### Controller (Gamepad)

| Button | Action |
|--------|--------|
| D-Pad Left / Left Stick | Move left |
| D-Pad Right / Left Stick | Move right |
| A / RB / RT | Fire |
| Start | Pause |
| Select | Restart (game over) |
| Y | Mute/Unmute |

**Supported Controllers:**
- Xbox (One, Series X/S, 360)
- PlayStation (DualShock 4, DualSense)
- Nintendo Switch Pro Controller
- 8BitDo controllers
- Generic USB/Bluetooth gamepads

> **Note**: Controller status is shown on the title screen and in-game (icon in bottom-right corner when connected)

## 📊 Scoring

| Enemy Type | Points |
|------------|--------|
| Bottom rows (1-2) | 10 |
| Middle rows (3-4) | 20 |
| Top row (5) | 30 |
| Mystery Ship | 50-300 (random) |

**Bonus**: Extra life every 10,000 points!

## 🏗️ Project Structure

```
retro-arcade-game/
├── AGENTS.md                    # AI agent instructions
├── .claude/agents/              # Subagent definitions
│   ├── game-engine.md
│   ├── renderer.md
│   ├── entity.md
│   ├── audio.md
│   ├── controller.md            # Gamepad support
│   ├── test-writer.md
│   └── docs-writer.md
├── src/
│   ├── main.js                  # Entry point
│   ├── game.js                  # Main game loop
│   ├── constants.js             # Configuration
│   ├── entities/                # Game objects
│   ├── managers/                # Systems
│   ├── renderer/                # Drawing
│   ├── audio/                   # Sound
│   └── utils/                   # Helpers
├── tests/                       # Unit tests
├── assets/                      # Sprites & sounds
└── docs/                        # Documentation
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm 9+

### Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run with coverage report

# Building
npm run build        # Production build
npm run build:gh-pages # Build for GitHub Pages
npm run preview      # Preview production build

# Deployment
npm run deploy       # Deploy to GitHub Pages (manual)

# Linting
npm run lint         # Check code style
npm run lint:fix     # Fix auto-fixable issues
```

## 🚀 Deployment to GitHub Pages

### Option 1: Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `main`.

**Setup steps:**

1. Push your code to GitHub
2. Go to your repository **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Push to `main` branch - deployment happens automatically!

Your game will be live at: `https://your-username.github.io/retro-arcade-game/`

### Option 2: Manual Deployment

```bash
# Build and deploy to gh-pages branch
npm run deploy
```

**Note:** Before deploying, update the repository name in `vite.config.js` if your repo has a different name:

```javascript
// vite.config.js
base: process.env.GITHUB_PAGES ? '/your-repo-name/' : '/',
```

### Option 3: Other Static Hosts

The production build works with any static hosting service:

```bash
# Build for production
npm run build

# The 'dist' folder is ready to deploy to:
# - Netlify (drag & drop dist folder)
# - Vercel (vercel deploy dist)
# - Cloudflare Pages
# - AWS S3 + CloudFront
# - Any static web server
```

### Troubleshooting: Changes Not Appearing

If changes to `src/constants.js` or other files aren't showing after deployment:

1. **Hard Refresh Browser**
   - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
   - Or open DevTools → Network tab → check "Disable cache" → reload

2. **Clear Browser Cache**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images/files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

3. **Wait for CDN Propagation**
   - GitHub Pages CDN can take 1-5 minutes to update
   - Check the workflow completed: Go to repo → Actions tab → verify latest run succeeded

4. **Verify Build Hash Changed**
   - In GitHub Actions logs, look for "List build output" step
   - The `main-[hash].js` filename should be different from previous builds

5. **Force Re-deploy**
   - Go to Actions → "Deploy to GitHub Pages" → click "Run workflow"

### Tech Stack

- **Bundler**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linting**: [ESLint](https://eslint.org/)
- **Font**: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)

## 🤖 AGENTS.md Integration

This project was scaffolded using the **lead/worker multi-agent pattern**:

### Lead Agent (Opus 4)
- Orchestrates project structure
- Makes architectural decisions
- Coordinates worker agents

### Worker Agents (Haiku 4)
- `game-engine`: Core loop, physics, timing
- `renderer`: Canvas drawing, effects
- `entity`: Player, enemies, projectiles
- `audio`: 8-bit sound synthesis
- `test-writer`: Unit tests
- `docs-writer`: Documentation

See [AGENTS.md](./AGENTS.md) for detailed agent instructions.

## 🎨 Customization

### Game Balance

Edit `src/constants.js` to adjust:

```javascript
export const PLAYER = {
  SPEED: 5,        // Movement speed
  LIVES: 3,        // Starting lives
  FIRE_RATE: 500,  // ms between shots
};

export const ENEMY = {
  ROWS: 5,         // Enemy rows
  COLS: 11,        // Enemy columns
  BASE_SPEED: 1,   // Starting speed
};
```

### Colors

Modify color constants in `src/constants.js`:

```javascript
export const PLAYER = {
  COLOR: '#00FF00',  // Player ship color
};

export const ENEMY = {
  COLORS: ['#FF0000', '#FF6600', '#FFFF00', '#00FFFF', '#FF00FF'],
};
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing`
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with 💚 using [goose](https://github.com/block/goose) + [Claude Code](https://claude.com/claude-code)**

*Following the [AGENTS.md](https://agents.md/) standard for AI agent collaboration*
