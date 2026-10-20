import { describe, expect, it } from "vitest";
import ts from "typescript";
import { runInNewContext } from "node:vm";
import { getInspectFields, inspect } from "@pixi/devtools";
import {
  getInspectedProperties,
  setInspectedProperty,
} from "../src/pixi-devtools/inspectedFields";
import pixiInspectedFields from "../src/pixi-devtools/pixiInspectedFields";
import rootController from "ui-protocol/src/controllers/rootController";
import { applyValues, syncTree } from "ui-protocol/src/tree-fns";

describe("inspected fields", () => {
  it("exposes only decorated primitives and preserves options and unusual field names", () => {
    const target = {
      speed: 5,
      name: "Goblin",
      invincible: false,
      K: 1,
      hidden: 42,
      "player's name": "Old",
    };
    inspect({
      min: 0,
      max: 20,
      step: 0.1,
      label: "Speed",
      section: "Gameplay",
      tooltip: "Movement speed",
    })(target, "speed");
    for (const name of ["name", "invincible", "K", "player's name"]) {
      inspect()(target, name);
    }
    const fields = getInspectedProperties(target);
    expect(fields.map(({ name }) => name)).toEqual([
      "speed",
      "name",
      "invincible",
      "K",
      "player's name",
    ]);
    expect(fields[0]).toMatchObject({
      label: "Speed",
      section: "Gameplay",
      tooltip: "Movement speed",
      min: 0,
      max: 20,
      step: 0.1,
    });
    expect(fields[1].section).toBe("Custom Fields");
    setInspectedProperty(target, "speed", 7.2);
    setInspectedProperty(target, "name", 'Goblin\'s "friend"\nSecond line');
    setInspectedProperty(target, "invincible", true);
    setInspectedProperty(target, "K", 10);
    setInspectedProperty(target, "player's name", "New");
    expect(target).toMatchObject({
      speed: 7.2,
      name: 'Goblin\'s "friend"\nSecond line',
      invincible: true,
      K: 10,
      "player's name": "New",
    });
  });

  it("round-trips numeric, negative, string, and mixed enums without numeric reverse mappings", () => {
    enum Movement {
      Idle = -1,
      Patrol = 0,
      Chase = 1,
    }
    enum Direction {
      Left = "left",
      Right = "right",
    }
    enum Mixed {
      Off = 0,
      On = "on",
    }
    const target = {
      movement: Movement.Patrol,
      direction: Direction.Left,
      mixed: Mixed.Off,
      difficulty: 1,
    };
    inspect({ enum: Movement })(target, "movement");
    inspect({ enum: Direction })(target, "direction");
    inspect({ enum: Mixed })(target, "mixed");
    inspect({ enum: { Easy: 1, Hard: 2 } })(target, "difficulty");
    const fields = getInspectedProperties(target);
    expect(fields[0]).toMatchObject({
      value: "Patrol",
      options: ["Idle", "Patrol", "Chase"],
    });
    expect(fields[1].options).toEqual(["Left", "Right"]);
    expect(fields[2].options).toEqual(["Off", "On"]);
    setInspectedProperty(target, "movement", "Idle");
    setInspectedProperty(target, "direction", "Right");
    setInspectedProperty(target, "mixed", "On");
    setInspectedProperty(target, "difficulty", "Hard");
    expect(target).toEqual({
      movement: -1,
      direction: "right",
      mixed: "on",
      difficulty: 2,
    });
    setInspectedProperty(target, "movement", "Unknown");
    expect(target.movement).toBe(-1);
  });

  it("rejects invalid writes and omits unsupported values", () => {
    const target = {
      speed: 5,
      hidden: 1,
      object: {},
      empty: null,
      missing: undefined,
      invalid: NaN,
      infinite: Infinity,
      large: 1n,
      symbol: Symbol(),
      fn: () => 1,
      emptyEnum: 0,
    };
    inspect({ min: 0, max: 10 })(target, "speed");
    for (const name of [
      "object",
      "empty",
      "missing",
      "invalid",
      "infinite",
      "large",
      "symbol",
      "fn",
    ]) {
      inspect()(target, name);
    }
    inspect({ enum: {} })(target, "emptyEnum");
    expect(getInspectedProperties(target).map(({ name }) => name)).toEqual([
      "speed",
    ]);
    for (const value of [
      NaN,
      Infinity,
      -Infinity,
      -1,
      11,
      "8",
      true,
      null,
      {},
    ]) {
      setInspectedProperty(target, "speed", value);
      expect(target.speed).toBe(5);
    }
    setInspectedProperty(target, "hidden", 2);
    setInspectedProperty(target, "__proto__", {});
    setInspectedProperty(target, "object", 1);
    expect(target.hidden).toBe(1);
    expect(target.object).toEqual({});
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    for (const value of [0, 10]) {
      setInspectedProperty(target, "speed", value);
      expect(target.speed).toBe(value);
    }
  });

  it.each([false, true])(
    "supports emitted TypeScript decorators (legacy: %s), inheritance and instance isolation",
    (legacy) => {
      const source = `
      class Base { @inspect({ label: 'Base speed' }) speed = 1; }
      class Enemy extends Base {
        @inspect({ label: 'Enemy speed' }) speed = 2;
        @inspect() health = 100;
      }
      class Friend extends Base { @inspect() nickname = 'Friend'; }
      exports.Base = Base;
      exports.Enemy = Enemy;
      exports.Friend = Friend;
    `;
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          experimentalDecorators: legacy,
        },
      });
      const classes = {} as Record<
        "Base" | "Enemy" | "Friend",
        new () => { speed: number; health?: number }
      >;
      runInNewContext(outputText, { inspect, exports: classes });
      const enemy = new classes.Enemy();
      expect([...getInspectFields(enemy).keys()]).toEqual(["speed", "health"]);
      expect(getInspectFields(enemy).get("speed")?.label).toBe("Enemy speed");
      expect(getInspectFields(new classes.Base()).get("speed")?.label).toBe(
        "Base speed",
      );
      expect([...getInspectFields(new classes.Friend()).keys()]).toEqual([
        "speed",
        "nickname",
      ]);
      setInspectedProperty(enemy, "health", 10);
      expect(enemy.health).toBe(10);
      expect(new classes.Enemy().health).toBe(100);
    },
  );

  it("reads metadata from the earlier devtools API through its shared symbol", () => {
    const target = {
      K: 5,
      [Symbol.for("@pixi/devtools/inspect-fields")]: { K: { step: 1 } },
    };
    expect(getInspectedProperties(target)[0]).toMatchObject({
      name: "K",
      value: 5,
      step: 1,
    });
    setInspectedProperty(target, "K", 10);
    expect(target.K).toBe(10);
  });

  it("syncs live values over the UI bridge, rebuilds selection, and rejects stale or destroyed-node writes", () => {
    const first = { speed: 5, destroyed: false };
    const second = { title: "Goblin", destroyed: false };
    inspect()(first, "speed");
    inspect()(second, "title");
    let selected: object | undefined = first;
    const root = rootController(() => [pixiInspectedFields(() => selected)]);
    const sync = () => syncTree(root, [], applyValues(root, []));
    const initial = sync();
    expect(initial.appends[0].slots?.children[0]).toMatchObject({
      component: "PixiCustomProperties",
      value: [{ name: "speed", value: 5 }],
    });
    const path = [
      { slot: "children", index: 0 },
      { slot: "children", index: 0 },
    ];
    expect(
      applyValues(root, [{ path, value: { name: "speed", value: 8 } }]).errors,
    ).toEqual([]);
    expect(first.speed).toBe(8);
    first.speed = 9;
    expect(sync().value[0].value).toMatchObject([{ name: "speed", value: 9 }]);
    selected = second;
    applyValues(root, [{ path, value: { name: "speed", value: 1 } }]);
    expect(first.speed).toBe(9);
    expect(sync().replacements[0]).toMatchObject({
      component: "PixiCustomProperties",
      value: [{ name: "title", value: "Goblin" }],
    });
    applyValues(root, [{ path, value: { name: "title", value: "Orc" } }]);
    expect(second.title).toBe("Orc");
    second.destroyed = true;
    applyValues(root, [{ path, value: { name: "title", value: "Invalid" } }]);
    expect(second.title).toBe("Orc");
    expect(sync().truncates[0].length).toBe(0);
    selected = undefined;
    expect(sync().errors).toEqual([]);
  });
});
