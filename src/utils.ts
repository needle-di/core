// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: any) => T;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isClass(target: unknown): target is Class<unknown> | Function {
  return typeof target === "function";
}
