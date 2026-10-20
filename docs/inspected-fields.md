# Editable game fields

Use `@inspect()` like Unity's `SerializeField` or Godot's `@export` to expose a field in PixiJS Devtools. Select the object in the scene tree, open **Object Properties**, and edit its **Custom Fields** section. Changes apply immediately to that instance.

```ts
import { Container } from "pixi.js";
import { inspect } from "@pixi/devtools";

enum MovementMode {
  Idle,
  Patrol,
  Chase,
}

export class Enemy extends Container {
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
}
```

Add the instance to your stage as usual, and expose the application with `globalThis.__PIXI_APP__ = app` as described in the [setup instructions](../README.md#usage).

## Controls and options

| Value                  | Control                                                |
| ---------------------- | ------------------------------------------------------ |
| `number`               | Number input, with optional limits and drag increments |
| `string`               | Text input                                             |
| `boolean`              | Checkbox                                               |
| Numeric or string enum | Dropdown showing member names                          |

| Option       | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `label`      | Display name; defaults to the field name                     |
| `section`    | Panel title; defaults to `Custom Fields`                     |
| `tooltip`    | Help text on the label                                       |
| `min`, `max` | Numeric bounds; out-of-range edits are rejected              |
| `step`       | Number input increment; `1` for whole-number increments      |
| `enum`       | Runtime enum or object mapping names to string/number values |

JavaScript uses `number` for both integers and decimals. `step: 1` sets the increment; it does not round values or change the field's type. Without a step, numbers can still be typed directly, including decimals.

Enums retain their original values. Selecting `Chase` in the example writes `MovementMode.Chase`, not the string `"Chase"`. Numeric reverse mappings are hidden. String enums and `as const` objects work too; `const enum` declarations have no runtime object to pass to the decorator.

Initialize fields with a supported primitive. Objects, arrays, functions, `null`, `undefined`, `bigint`, symbols, and non-finite numbers are omitted. Only decorated fields can be edited through Custom Fields. Inherited fields appear on subclasses, and decorating a field again overrides its options without changing the base class or sibling classes.

Use public instance fields on objects in the scene tree. Standalone local variables, static fields, JavaScript `#private` fields, and symbol-named fields are unsupported. A TypeScript `private` field with an ordinary JavaScript name is exposed if decorated.

## Setup and compatibility

This repository includes a local `@pixi/devtools` package with the decorator. Run `pnpm install` and `pnpm -r prebuild` from the repository root to link and build it. The root `dev` and `build` commands also build it before consumers. For a separate game project, install this local package by path or pack it after building; the public npm release is a separate package and is not updated by these changes.

Use the extension built from this repository, or its embedded example inspector. Existing published extensions do not include this integration. Decorator metadata from the previous `Documents/devtools` implementation uses the same symbol and is understood here.

Both standard TypeScript field decorators and `experimentalDecorators: true` are supported, without `reflect-metadata` or `emitDecoratorMetadata`. Use whichever decorator mode your bundler supports.

The example enables `experimentalDecorators` so Vite lowers decorators for browsers. If your bundler leaves standard decorator syntax in its output, enable this option in your game's `tsconfig.json` as well.

Changes affect the running instance and are reset on reload. They are not saved to source files or scene data.

## Try it

Run `pnpm dev` from the repository root, then open the example-pixi-project address printed by Vite. The selected **Goblin** container exposes speed, name, invincibility, `K`, movement mode, and a string direction enum under **Object Properties → Custom Fields**. Speed, mode, and direction change the animation; invincibility changes opacity; the name updates the tree label. `K` is an editable integer example.

The demo is in `apps/example-pixi-project/src/InspectorDemo.ts`. Adding `?spin=0` disables its ticker updates.
