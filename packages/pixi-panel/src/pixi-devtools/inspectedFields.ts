import { getInspectEnumEntries, getInspectFields } from "@pixi/devtools";
import type { InspectValue } from "@pixi/devtools";

export type InspectedField = {
  name: string;
  label: string;
  section: string;
  tooltip?: string;
  value: InspectValue;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
};

export function getInspectedProperties(target: object): InspectedField[] {
  const fields: InspectedField[] = [];
  for (const [name, options] of getInspectFields(target)) {
    const value: unknown = Reflect.get(target, name);
    if (
      (typeof value !== "number" &&
        typeof value !== "string" &&
        typeof value !== "boolean") ||
      (typeof value === "number" && !Number.isFinite(value))
    ) {
      continue;
    }
    const entries = options.enum
      ? getInspectEnumEntries(options.enum)
      : undefined;
    if (entries && entries.length === 0) {
      continue;
    }
    fields.push({
      name,
      label: options.label ?? name,
      section: options.section ?? "Custom Fields",
      tooltip: options.tooltip,
      value: entries
        ? (entries.find(([, entry]) => entry === value)?.[0] ?? "")
        : value,
      options: entries?.map(([label]) => label),
      min: options.min,
      max: options.max,
      step: options.step,
    });
  }
  return fields;
}

/** Only decorated fields accept writes, with their original runtime types. */
export function setInspectedProperty(
  target: object,
  name: string,
  value: unknown,
): void {
  const options = getInspectFields(target).get(name);
  if (!options) {
    return;
  }
  const current: unknown = Reflect.get(target, name);
  if (
    (typeof current !== "number" &&
      typeof current !== "string" &&
      typeof current !== "boolean") ||
    (typeof current === "number" && !Number.isFinite(current))
  ) {
    return;
  }
  if (options.enum) {
    const entry = getInspectEnumEntries(options.enum).find(
      ([label]) => label === value,
    );
    if (entry) {
      Reflect.set(target, name, entry[1]);
    }
    return;
  }
  if (typeof value !== typeof current) {
    return;
  }
  if (typeof value === "number") {
    if (
      !Number.isFinite(value) ||
      (options.min !== undefined && value < options.min) ||
      (options.max !== undefined && value > options.max)
    ) {
      return;
    }
  }
  Reflect.set(target, name, value);
}
