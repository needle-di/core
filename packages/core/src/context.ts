import { Container } from "./container.ts";
import type { Token } from "./tokens.ts";

/**
 * Injects a service within the current injection context, using the token provided.
 */
export function inject<T>(token: Token<T>, options: { multi: true }): T[];
export function inject<T>(token: Token<T>, options: { optional: true }): T | undefined;
export function inject<T>(token: Token<T>, options: { multi: true; optional: true }): T[] | undefined;
export function inject<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T;
export function inject<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T | T[] | undefined {
  try {
    return _currentContext.run((container) => container.get(token, options));
  } catch (error) {
    if (error instanceof NeedsInjectionContextError && options?.optional === true) {
      return undefined;
    }

    throw error;
  }
}

/**
 * Injects a service asynchronously within the current injection context, using the token provided.
 */
export async function injectAsync<T>(token: Token<T>, options: { multi: true }): Promise<T[]>;
export async function injectAsync<T>(token: Token<T>, options: { optional: true }): Promise<T | undefined>;
export async function injectAsync<T>(
  token: Token<T>,
  options: { multi: true; optional: true },
): Promise<T[] | undefined>;
export async function injectAsync<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): Promise<T>;
export async function injectAsync<T>(
  token: Token<T>,
  options?: {
    optional?: boolean;
    multi?: boolean;
  },
): Promise<T | T[] | undefined> {
  try {
    return _currentContext.runAsync((container) => container.getAsync(token, options));
  } catch (error) {
    if (error instanceof NeedsInjectionContextError && options?.optional === true) {
      return undefined;
    }

    throw error;
  }
}

/**
 * A context has a specific container associated to it and allows you to run sync or async code.
 *
 * @internal
 */
interface Context {
  run<T>(block: (container: Container) => T): T;
  runAsync<T>(block: (container: Container) => Promise<T>): Promise<T>;
}

/**
 * The global context does not allow dependency injection.
 *
 * @internal
 */
class GlobalContext implements Context {
  run<T>(): T {
    throw new NeedsInjectionContextError();
  }

  runAsync<T>(): Promise<T> {
    throw new NeedsInjectionContextError();
  }
}

/**
 * An injection context allows to perform dependency injection with `inject()` and `injectAsync()`.
 *
 * @internal
 */
class InjectionContext implements Context {
  constructor(private readonly container: Container) {}

  run<T>(block: (container: Container) => T): T {
    const originalContext = _currentContext;
    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      _currentContext = this;
      return block(this.container);
    } finally {
      _currentContext = originalContext;
    }
  }

  async runAsync<T>(block: (container: Container) => Promise<T>): Promise<T> {
    const originalContext = _currentContext;
    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      _currentContext = this;
      return await block(this.container);
    } finally {
      _currentContext = originalContext;
    }
  }
}

let _currentContext: Context = new GlobalContext();

/**
 * Creates a new injection context.
 *
 * @internal
 */
export function injectionContext(container: Container): Context {
  return new InjectionContext(container);
}

/**
 * An error that occurs when `inject()` or `injectAsync()` is used outside an injection context.
 *
 * @internal
 */
class NeedsInjectionContextError extends Error {
  constructor() {
    super(`You can only invoke inject() or injectAsync() within an injection context`);
  }
}
