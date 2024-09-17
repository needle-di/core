/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { type Class, isClass } from "./utils.js";

export type Token<T> =
  | Class<T>
  | Function
  | string
  | symbol
  | InjectionToken<T>;

export class InjectionToken<T> {
  constructor(
    private description: string | symbol,
    public options?: { factory: () => T },
  ) {}

  public toString(): string {
    return `InjectionToken ${String(this.description)}`;
  }
}

export function isClassToken<T>(token: Token<T>): token is Class<T> {
  return isClass(token);
}

export function isInjectionToken<T>(
  token: Token<T>,
): token is InjectionToken<T> {
  return token instanceof InjectionToken;
}

export function toString<T>(token: Token<T>): string {
  if (isClass(token)) {
    return token.prototype.name ?? token.name;
  } else if (typeof token === "symbol") {
    return String(token);
  } else if (token instanceof InjectionToken) {
    return token.toString();
  } else {
    return token;
  }
}
