import type { InjectableClass } from "./decorators.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: any[]) => T;

export interface AbstractClass<T> {
  prototype: T;
  name: string;
}

export function isClass(target: unknown): target is Class<unknown> | AbstractClass<unknown> {
  return typeof target === "function";
}

export function getParentClasses(target: Class<unknown>): InjectableClass[] {
  const parentClasses: InjectableClass[] = [];
  let currentClass = target as InjectableClass;
  while (Object.getPrototypeOf(currentClass).name) {
    const parentClass: InjectableClass = Object.getPrototypeOf(currentClass);
    parentClasses.push(parentClass);
    currentClass = parentClass;
  }
  return parentClasses;
}

export function assertPresent<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }
  return value;
}
