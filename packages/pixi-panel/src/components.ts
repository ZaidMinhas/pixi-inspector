import components from "ui-protocol/src/svelte/components";
import Instructions from "./Instructions.svelte";
import SceneGraphLegacy from "./SceneGraphLegacy.svelte";
import ObjectProperties from "./ObjectProperties.svelte";
import TextProperties from "./TextProperties.svelte";
import CustomProperties from "./CustomProperties.svelte";

// Register Pixi components for ui-protocol
Object.assign(components, {
  PixiInstructions: Instructions,
  PixiSceneGraph: SceneGraphLegacy,
  PixiObjectProperties: ObjectProperties,
  PixiTextProperties: TextProperties,
  PixiCustomProperties: CustomProperties,
});

declare global {
  interface UIProtocolComponents {
    PixiInstructions: typeof Instructions;
    PixiSceneGraph: typeof SceneGraphLegacy;
    PixiObjectProperties: typeof ObjectProperties;
    PixiTextProperties: typeof TextProperties;
    PixiCustomProperties: typeof CustomProperties;
  }
}
