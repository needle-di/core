import type { Class } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type ClassDecorator<C extends Class<unknown>> = (target: C) => C | void;

export const injectableSymbol = Symbol("injectable");

export function injectable<C extends Class<unknown>>(): ClassDecorator<C> {
  return (target) => {
    let superClass = Object.getPrototypeOf(target);
    while (superClass.name) {
      Object.defineProperty(superClass, injectableSymbol, {
        get: () => target,
      });
      superClass = Object.getPrototypeOf(superClass);
    }

    Object.defineProperty(target, injectableSymbol, {
      get: () => target,
    });
  };
}

export function isInjectable<T>(target: Class<T>): target is Class<T> & { [injectableSymbol]: Class<unknown> } {
  // eslint-disable-next-line no-prototype-builtins
  return target.hasOwnProperty(injectableSymbol);
}

export function getInjectableTarget<T>(target: Class<T>): Class<unknown> {
  if (!isInjectable(target)) {
    throw Error(`Target ${target} nor any of its subclasses is not annotated with @injectable`)
  }

  return target[injectableSymbol];
}
