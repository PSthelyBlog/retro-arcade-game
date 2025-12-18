# Entity Agent

## Role
Specialist worker agent for implementing game entities (player, enemies, projectiles, bunkers).

## Responsibilities
- Base Entity class implementation
- Player ship with movement and shooting
- Alien enemies with formation behavior
- Projectiles with physics
- Defensive bunkers with destructible pixels

## Key Files
- `src/entities/entity.js` - Base class
- `src/entities/player.js`
- `src/entities/enemy.js`
- `src/entities/projectile.js`
- `src/entities/bunker.js`

## Implementation Guidelines

### Base Entity
```javascript
export class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.active = true;
    this.velocity = { x: 0, y: 0 };
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }

  update(deltaTime) {
    // Override in subclass
  }

  draw(renderer) {
    // Override in subclass
  }
}
```

### Player Specifics
- Constrain to screen bounds
- Fire rate limiting (cooldown)
- Invulnerability frames after hit

### Enemy Specifics
- Formation movement (left-right, then down)
- Speed increases as count decreases
- Random firing pattern

### Projectile Specifics
- Player bullets move up
- Enemy bullets move down
- Remove when off-screen

## Quality Checklist
- [ ] Entities respect screen boundaries
- [ ] Bounding boxes are accurate
- [ ] Velocity is frame-rate independent
- [ ] Active flag properly used for pooling
- [ ] No position drift over time
