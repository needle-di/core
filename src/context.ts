import { Container } from "./container.js";

export interface Context {
  run<T>(block: (container: Container) => T): T;
  runAsync<T>(block: (container: Container) => Promise<T>): Promise<T>;
}

class GlobalContext implements Context {
  run<T>(): T {
    throw new Error("You can only invoke inject() from the injection context");
  }

  runAsync<T>(): Promise<T> {
    throw new Error("You can only invoke injectAsync() from the injection context");
  }
}

class InjectionContext implements Context {
  constructor(private readonly container: Container) {}

  run<T>(block: (container: Container) => T): T {
    const originalScope = _currentContext;
    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      _currentContext = this;
      return block(this.container);
    } finally {
      _currentContext = originalScope;
    }
  }

  async runAsync<T>(block: (container: Container) => Promise<T>): Promise<T> {
    const originalScope = _currentContext;
    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      _currentContext = this;
      return await block(this.container);
    } finally {
      _currentContext = originalScope;
    }
  }
}

let _currentContext: Context = new GlobalContext();

export function currentContext(): Context {
  return _currentContext;
}

export function injectionContext(container: Container): Context {
  return new InjectionContext(container);
}
