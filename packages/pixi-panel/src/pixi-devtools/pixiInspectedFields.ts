import forEachController from "ui-protocol/src/controllers/forEachController";
import defineUI from "ui-protocol/src/svelte/defineUI";
import {
  getInspectedProperties,
  setInspectedProperty,
} from "./inspectedFields";

type Target = object & { destroyed?: boolean };

export default function pixiInspectedFields(
  getTarget: () => Target | undefined,
) {
  return forEachController(
    () => {
      const target = getTarget();
      return target && !target.destroyed ? [target] : [];
    },
    (target) =>
      defineUI({
        component: "PixiCustomProperties",
        getValue: () => getInspectedProperties(target),
        setValue({ name, value }) {
          // Ignore events still in flight after selecting another object.
          if (getTarget() === target && !target.destroyed) {
            setInspectedProperty(target, name, value);
          }
        },
      }),
  );
}
