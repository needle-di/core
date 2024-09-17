import type { Class } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type ClassDecorator<C extends Class<unknown>> = (target: C) => C | void;

export const injectableSymbol = Symbol("injectable");

export function injectable<C extends Class<unknown>>(): ClassDecorator<C> {
  return (target) =>
    Object.defineProperty(target, injectableSymbol, {
      value: true,
      writable: false,
    });
}

export function isInjectable<T>(target: Class<T>) {
  // eslint-disable-next-line no-prototype-builtins
  return target.hasOwnProperty(injectableSymbol);
}
