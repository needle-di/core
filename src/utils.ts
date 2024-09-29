// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: any[]) => T;

export interface AbstractClass<T> {
  prototype: T;
  name: string;
}

/**
 * Type-guard to assert if the given object is an (abstract) class.
 * @internal
 */
export function isClassLike(target: unknown): target is Class<unknown> | AbstractClass<unknown> {
  return typeof target === "function";
}

/**
 * Returns all parent classes of a given class.
 * @internal
 */
export function getParentClasses(target: Class<unknown>): Class<unknown>[] {
  const parentClasses: Class<unknown>[] = [];
  let currentClass = target;
  while (Object.getPrototypeOf(currentClass).name) {
    const parentClass: Class<unknown> = Object.getPrototypeOf(currentClass);
    parentClasses.push(parentClass);
    currentClass = parentClass;
  }
  return parentClasses;
}

/**
 * Ensures a given value is not null or undefined.
 * @internal
 */
export function assertPresent<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }
  return value;
}
