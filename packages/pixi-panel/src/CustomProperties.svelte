<script lang="ts">
  import CheckboxInput from "blender-elements/src/CheckboxInput/CheckboxInput.svelte";
  import NumberInput from "blender-elements/src/NumberInput/NumberInput.svelte";
  import TextInput from "blender-elements/src/TextInput/TextInput.svelte";
  import SelectMenu from "blender-elements/src/SelectMenu/SelectMenu.svelte";
  import Property from "blender-elements/src/Property/Property.svelte";
  import Panel from "blender-elements/src/Panel/Panel.svelte";
  import Box from "blender-elements/src/Box/Box.svelte";
  import type { InspectValue } from "@pixi/devtools";
  import type { InspectedField } from "./pixi-devtools/inspectedFields";

  type Props = {
    value: InspectedField[];
    setValue?: (change: { name: string; value: InspectValue }) => void;
  };
  let { value, setValue }: Props = $props();
  let sections = $derived([...Map.groupBy(value, (field) => field.section)]);
</script>

{#each sections as [section, fields] (section)}
  <Panel title={section}>
    <Box padding={8} gap={6}>
      {#each fields as field (field.name)}
        <Property label={field.label} hint={field.tooltip}>
          {#if field.options}
            <SelectMenu
              value={String(field.value)}
              options={field.options}
              setValue={(next) => setValue?.({ name: field.name, value: next })}
            />
          {:else if typeof field.value === "number"}
            <NumberInput
              value={field.value}
              min={field.min}
              max={field.max}
              step={field.step}
              setValue={(next) => setValue?.({ name: field.name, value: next })}
            />
          {:else if typeof field.value === "boolean"}
            <CheckboxInput
              value={field.value}
              setValue={(next) => setValue?.({ name: field.name, value: next })}
            />
          {:else}
            <TextInput
              value={field.value}
              setValue={(next) => setValue?.({ name: field.name, value: next })}
            />
          {/if}
        </Property>
      {/each}
    </Box>
  </Panel>
{/each}
