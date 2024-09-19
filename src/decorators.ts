import type { Class } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type ClassDecorator<C extends Class<unknown>> = (target: C) => C | void;

export const injectableSymbol = Symbol("injectable");

export type InjectableClass<T = unknown> = Class<T> & { [injectableSymbol]: Class<unknown>[]};

export function injectable<C extends Class<unknown>>(): ClassDecorator<C> {
  return (target) => {
    let superClass = Object.getPrototypeOf(target);
    while (superClass.name) {
      if (!Object.getOwnPropertyDescriptor(superClass, injectableSymbol)) {
        Object.defineProperty(superClass, injectableSymbol, {
          value: [target],
          writable: true,
        });
      } else {
        superClass[injectableSymbol] = [...superClass[injectableSymbol], target];
      }
      superClass = Object.getPrototypeOf(superClass);
    }

    Object.defineProperty(target, injectableSymbol, {
      value: [target],
      writable: true,
    });
  };
}

export function isInjectable<T>(target: Class<T>): target is InjectableClass<T> {
  // eslint-disable-next-line no-prototype-builtins
  return target.hasOwnProperty(injectableSymbol);
}

export function getInjectableTargets<T>(target: InjectableClass<T>): Class<unknown>[] {
  return target[injectableSymbol];
}
