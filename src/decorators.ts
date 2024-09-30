import { type AbstractClass, type Class, getParentClasses } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type ClassDecorator<C extends Class<unknown>> = (target: C) => C | void;

export const injectableSymbol = Symbol("injectable");

export type InjectableClass<T = unknown> = (Class<T> | AbstractClass<T>) & { [injectableSymbol]: Class<unknown>[] };

export function injectable<C extends Class<unknown>>(): ClassDecorator<C> {
  return (target) => {
    getParentClasses(target).forEach((parentClass) => {
      if (!Object.getOwnPropertyDescriptor(parentClass, injectableSymbol)) {
        Object.defineProperty(parentClass, injectableSymbol, {
          value: [target],
          writable: true,
          enumerable: false,
        });
      } else {
        const injectableParentClass = parentClass as InjectableClass;
        injectableParentClass[injectableSymbol] = [...injectableParentClass[injectableSymbol], target];
      }
    });

    Object.defineProperty(target, injectableSymbol, {
      value: [target],
      writable: true,
    });
  };
}

export function isInjectable<T>(target: AbstractClass<T>): target is InjectableClass<T> {
  // eslint-disable-next-line no-prototype-builtins
  return target.hasOwnProperty(injectableSymbol);
}

export function getInjectableTargets<T>(target: InjectableClass<T>): Class<unknown>[] {
  return target[injectableSymbol];
}
