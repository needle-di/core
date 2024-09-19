import {
  type Token,
  isClassToken,
  toString,
  isInjectionToken,
} from "./tokens.js";
import {
  isClassProvider,
  isFactoryProvider,
  isConstructorProvider,
  isValueProvider,
  type Provider,
  isAsyncFactoryProvider,
} from "./providers.js";
import { isInjectable } from "./decorators.js";

export class Container {
  private providers = new ProviderMap();
  private singletons = new SingletonMap();

  bind<T>(provider: Provider<T>): this {
    const token = isConstructorProvider(provider) ? provider : provider.provide;

    if (this.providers.has(token)) {
      // todo: log warning, since we're overwriting a provider?
      //  alternatively, provide both .bind() and .rebind() semantics?
    }

    this.providers.set(token, provider);

    // todo: should support eagerly resolved providers or not?

    return this;
  }

  get<T>(token: Token<T>, options: { optional: true }): T | undefined;
  get<T>(token: Token<T>, options?: { optional: boolean }): T;
  get<T>(token: Token<T>, options?: { optional: boolean }): T | undefined {
    this.autoBindIfNeeded(token);

    if (!this.providers.has(token)) {
      if (options?.optional) {
        return undefined;
      }
      throw Error(`No provider found for ${toString(token)}`);
    }

    const provider = assertNotNull(this.providers.get(token));

    if (!this.singletons.has(token)) {
      if (isAsyncFactoryProvider(provider)) {
        throw new Error(
          `Provider for token ${toString(token)} is async, please use injectAsync() or container.getAsync() instead`,
        );
      }

      this.singletons.set(token, construct(provider, this));
    }

    return assertNotNull(this.singletons.get(token));
  }

  async getAsync<T>(
    token: Token<T>,
    options: { optional: true },
  ): Promise<T | undefined>;
  async getAsync<T>(
    token: Token<T>,
    options?: { optional: boolean },
  ): Promise<T>;
  async getAsync<T>(
    token: Token<T>,
    options?: { optional: boolean },
  ): Promise<T | undefined> {
    this.autoBindIfNeeded(token);

    if (!this.providers.has(token)) {
      if (options?.optional) {
        return Promise.resolve(undefined);
      }
      throw Error(`No provider found for ${toString(token)}`);
    }

    const provider = assertNotNull(this.providers.get(token));

    if (!this.singletons.has(token)) {
      const value = await constructAsync(provider, this);
      this.singletons.set(token, value);
    }

    return await promisify(assertNotNull(this.singletons.get(token)));
  }

  private autoBindIfNeeded<T>(token: Token<T>) {
    if (!this.providers.has(token)) {
      if (isClassToken(token) && isInjectable(token)) {
        this.bind({
          provide: token,
          useClass: token,
        });

        // inheritance support: also bind for its super classes
        let superClass = Object.getPrototypeOf(token);
        while (superClass.name) {
          this.bind({
            provide: superClass,
            useClass: token,
          });
          superClass = Object.getPrototypeOf(superClass)
        }
      } else if (isInjectionToken(token) && token.options?.factory) {
        if (!token.options.async) {
          this.bind({
            provide: token,
            async: false,
            useFactory: token.options.factory,
          });
        } else if (token.options.async) {
          this.bind({
            provide: token,
            async: true,
            useFactory: token.options.factory,
          });
        }
      }
    }
  }
}

let currentScope: Container | undefined = undefined;

export function inject<T>(
  token: Token<T>,
  options: { optional: true },
): T | undefined;
export function inject<T>(token: Token<T>): T;
export function inject<T>(
  token: Token<T>,
  options?: { optional: boolean },
): T | undefined {
  if (currentScope === undefined) {
    throw new Error("You can only invoke inject() from the injection context");
  }
  return currentScope.get(token, options);
}

export function injectAsync<T>(
  token: Token<T>,
  options: { optional: true },
): Promise<T | undefined>;
export function injectAsync<T>(token: Token<T>): Promise<T>;
export function injectAsync<T>(
  token: Token<T>,
  options?: { optional: boolean },
): Promise<T | undefined> {
  if (currentScope === undefined) {
    throw new Error(
      "You can only invoke injectAsync() from the injection context",
    );
  }
  return currentScope.getAsync(token, options);
}

function construct<T>(provider: Provider<T>, scope: Container): Promise<T> | T {
  const originalScope = currentScope;
  try {
    currentScope = scope;
    return doConstruct(provider, scope);
  } finally {
    currentScope = originalScope;
  }
}

async function constructAsync<T>(
  provider: Provider<T>,
  scope: Container,
): Promise<T> {
  const originalScope = currentScope;
  try {
    currentScope = scope;
    return await promisify(doConstruct(provider, scope));
  } finally {
    currentScope = originalScope;
  }
}

// see: https://github.com/tc39/proposal-promise-try
async function promisify<T>(value: T | Promise<T>): Promise<T> {
  return new Promise<T>((resolve) => resolve(value));
}

function doConstruct<T>(
  provider: Provider<T>,
  scope: Container,
): T | Promise<T> {
  if (isConstructorProvider(provider)) {
    return new provider();
  } else if (isClassProvider(provider)) {
    return new provider.useClass();
  } else if (isValueProvider(provider)) {
    return provider.useValue;
  } else if (isFactoryProvider(provider)) {
    return provider.useFactory();
  } else {
    return scope.get(provider.useExisting);
  }
}

class ProviderMap extends Map<Token<unknown>, Provider<unknown>> {
  override get<T>(key: Token<T>): Provider<T> | undefined {
    return super.get(key) as Provider<T> | undefined;
  }

  override set<T>(key: Token<T>, value: Provider<T>): this {
    return super.set(key, value);
  }
}

class SingletonMap extends Map<Token<unknown>, unknown> {
  override get<T>(token: Token<T>): T | undefined {
    return super.get(token) as T | undefined;
  }

  override set<T>(token: Token<T>, value: T): this {
    return super.set(token, value);
  }
}

export function bootstrap<T>(token: Token<T>): T {
  return new Container().get(token);
}

export function bootstrapAsync<T>(token: Token<T>): Promise<T> {
  return new Container().getAsync(token);
}

function assertNotNull<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }
  return value;
}
