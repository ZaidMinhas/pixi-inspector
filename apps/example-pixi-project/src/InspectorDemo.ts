import { Container } from "pixi.js";
import { inspect } from "@pixi/devtools";

enum MovementMode {
  Idle,
  Patrol,
  Chase,
}

enum Direction {
  Clockwise = "clockwise",
  Counterclockwise = "counterclockwise",
}

export class InspectorDemo extends Container {
  @inspect({ min: 0, max: 20, step: 0.1 })
  speed = 5;

  @inspect()
  displayName = "Goblin";

  @inspect()
  invincible = false;

  @inspect({ step: 1 })
  K = 10;

  @inspect({ enum: MovementMode })
  movementMode = MovementMode.Patrol;

  @inspect({ enum: Direction })
  direction = Direction.Counterclockwise;

  update(deltaTime: number) {
    this.label = this.displayName;
    this.alpha = this.invincible ? 0.5 : 1;
    if (this.movementMode !== MovementMode.Idle) {
      const direction = this.direction === Direction.Clockwise ? 1 : -1;
      const multiplier = this.movementMode === MovementMode.Chase ? 2 : 1;
      this.rotation += direction * multiplier * this.speed * 0.002 * deltaTime;
    }
  }
}
