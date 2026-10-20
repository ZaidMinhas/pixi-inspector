/** Values supported by the custom field inspector. */
export type InspectValue = string | number | boolean;

export interface InspectOptions {
  label?: string;
  section?: string;
  tooltip?: string;
  /** A runtime TypeScript enum or an object mapping names to values. */
  enum?: Readonly<Record<string, string | number>>;
  min?: number;
  max?: number;
  /** Number input increment. Use 1 for whole-number increments. */
  step?: number;
}

// Shared with the earlier @pixi/devtools implementation and injected bundles.
const inspectFields = Symbol.for("@pixi/devtools/inspect-fields");
type FieldMetadata = Record<string, InspectOptions>;
type Inspectable = { [inspectFields]?: FieldMetadata };

function registerField(target: object, name: string, options: InspectOptions) {
  if (!Object.prototype.hasOwnProperty.call(target, inspectFields)) {
    Object.defineProperty(target, inspectFields, {
      value: Object.create(null),
    });
  }
  (target as Inspectable)[inspectFields]![name] = options;
}

/** Expose a public instance field in Devtools, using standard or legacy decorators. */
export function inspect(options: InspectOptions = {}) {
  const metadata = {
    ...options,
    enum: options.enum ? { ...options.enum } : undefined,
  };

  function decorator<This extends object, Value extends InspectValue>(
    value: undefined,
    context: ClassFieldDecoratorContext<This, Value>,
  ): void;
  function decorator(target: object, name: string | symbol): void;
  function decorator<This extends object, Value extends InspectValue>(
    target: object | undefined,
    context: string | symbol | ClassFieldDecoratorContext<This, Value>,
  ): void {
    if (typeof context === "object") {
      if (
        context.static ||
        context.private ||
        typeof context.name !== "string" ||
        context.kind !== "field"
      ) {
        throw new TypeError(
          "@inspect() supports public instance fields with string names.",
        );
      }
      const name = context.name;
      context.addInitializer(function () {
        registerField(this, name, metadata);
      });
    } else {
      if (
        !target ||
        typeof target === "function" ||
        typeof context !== "string"
      ) {
        throw new TypeError(
          "@inspect() supports public instance fields with string names.",
        );
      }
      registerField(target, context, metadata);
    }
  }
  return decorator;
}

/** @internal Read inherited metadata without modifying base classes. */
export function getInspectFields(target: object): Map<string, InspectOptions> {
  const chain: object[] = [];
  for (
    let current: object | null = target;
    current;
    current = Object.getPrototypeOf(current)
  ) {
    chain.unshift(current);
  }
  const fields = new Map<string, InspectOptions>();
  for (const current of chain) {
    if (Object.prototype.hasOwnProperty.call(current, inspectFields)) {
      for (const [name, options] of Object.entries(
        (current as Inspectable)[inspectFields]!,
      )) {
        fields.set(name, options);
      }
    }
  }
  return fields;
}

/** @internal Omit the reverse mappings emitted by numeric TypeScript enums. */
export function getInspectEnumEntries(
  values: NonNullable<InspectOptions["enum"]>,
): [string, string | number][] {
  return Object.entries(values).filter(([name, value]) => {
    if (typeof value === "number") {
      return Number.isFinite(value);
    }
    return !(
      typeof value === "string" &&
      typeof values[value] === "number" &&
      String(values[value]) === name
    );
  });
}
