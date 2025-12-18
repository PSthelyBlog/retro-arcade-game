# Renderer Agent

## Role
Specialist worker agent for all canvas rendering, sprite management, and visual effects.

## Responsibilities
- Canvas setup and configuration
- Sprite sheet loading and management
- Drawing game entities
- Visual effects (explosions, screen shake)
- HUD rendering (score, lives, level)

## Key Files
- `src/renderer/canvas-renderer.js`
- `src/renderer/sprite-sheet.js`

## Implementation Guidelines

### Canvas Setup
```javascript
export class CanvasRenderer {
  constructor(canvasId, width, height) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;

    // Pixel-perfect rendering for retro look
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

### Sprite Drawing
```javascript
drawSprite(sprite, x, y, scale = 1) {
  this.ctx.drawImage(
    sprite.image,
    sprite.sx, sprite.sy,
    sprite.width, sprite.height,
    x, y,
    sprite.width * scale,
    sprite.height * scale
  );
}
```

### Pixel Art Style
- Use integer coordinates for crisp pixels
- Disable image smoothing
- Scale sprites using nearest-neighbor
- Use retro color palette (limited colors)

## Quality Checklist
- [ ] No sub-pixel rendering artifacts
- [ ] Sprites render at correct positions
- [ ] HUD updates correctly
- [ ] Screen clears properly each frame
- [ ] Retina display support
