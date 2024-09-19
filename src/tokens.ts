import { type AbstractClass, type Class, isClass } from "./utils.js";

export type Token<T> =
  | Class<T>
  | AbstractClass<T>
  | string
  | symbol
  | InjectionToken<T>;

interface InjectionTokenOptions<T> {
  async?: false,
  factory: () => T
}

interface AsyncInjectionTokenOptions<T> {
  async: true,
  factory: () => Promise<T>
}

export class InjectionToken<T> {
  constructor(
    private description: string | symbol,
    public options?: InjectionTokenOptions<NoInfer<T>> | AsyncInjectionTokenOptions<NoInfer<T>>,
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
    return token.name;
  } else if (typeof token === "symbol") {
    return String(token);
  } else if (token instanceof InjectionToken) {
    return token.toString();
  } else {
    return token;
  }
}
