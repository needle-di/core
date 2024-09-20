// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: any[]) => T;
export interface AbstractClass<T> {
  prototype: T;
  name: string;
}

export function isClass(target: unknown): target is Class<unknown> | AbstractClass<unknown> {
  return typeof target === "function";
}
