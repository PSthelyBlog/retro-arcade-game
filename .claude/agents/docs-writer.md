# Documentation Writer Agent

## Role
Specialist worker agent for creating and maintaining project documentation.

## Responsibilities
- README.md with setup instructions
- API documentation
- Inline code comments
- Architecture diagrams
- Contributing guidelines

## Key Files
- `README.md`
- `docs/api.md`
- `CONTRIBUTING.md` (if needed)

## Implementation Guidelines

### README Structure
```markdown
# Retro Arcade Game 🚀👾

A classic Space Invaders clone built with vanilla JavaScript and HTML5 Canvas.

## 🎮 Play Now
[Live Demo](link-to-demo)

## Features
- Classic Space Invaders gameplay
- Retro pixel art graphics
- 8-bit synthesized sound effects
- High score tracking
- Multiple difficulty levels

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
\`\`\`bash
git clone https://github.com/user/retro-arcade-game.git
cd retro-arcade-game
npm install
npm run dev
\`\`\`

## Controls
| Key | Action |
|-----|--------|
| ← / A | Move left |
| → / D | Move right |
| Space | Fire |
| P | Pause |
| R | Restart |
| M | Mute |

## Development
\`\`\`bash
npm run dev      # Start dev server
npm test         # Run tests
npm run build    # Production build
\`\`\`

## Architecture
[Link to architecture docs]

## License
MIT
```

### Code Comments
```javascript
/**
 * Manages collision detection between game entities.
 * Uses AABB (Axis-Aligned Bounding Box) algorithm for efficiency.
 */
export class CollisionDetector {
  /**
   * Check if two entities are colliding.
   * @param {Entity} a - First entity
   * @param {Entity} b - Second entity
   * @returns {boolean} True if entities overlap
   */
  static checkCollision(a, b) {
    // AABB collision detection
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
```

### JSDoc Standards
- All public classes documented
- All public methods documented
- Parameter types specified
- Return types specified
- Examples for complex methods

## Quality Checklist
- [ ] README has all essential sections
- [ ] Setup instructions are accurate
- [ ] Controls documented
- [ ] API docs generated
- [ ] Code comments are helpful
- [ ] No spelling/grammar errors
