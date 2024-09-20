import { type Token, isClassToken, toString, isInjectionToken } from "./tokens.js";
import {
  isClassProvider,
  isFactoryProvider,
  isConstructorProvider,
  isValueProvider,
  type Provider,
  isAsyncFactoryProvider,
  isMultiProvider,
  isExistingProvider,
} from "./providers.js";
import { getInjectableTargets, isInjectable } from "./decorators.js";

export class Container {
  private providers: ProviderMap = new Map();
  private singletons: SingletonMap = new Map();

  bind<T>(provider: Provider<T>): this {
    const token = isConstructorProvider(provider) ? provider : provider.provide;
    const multi = isMultiProvider(provider);

    if (isExistingProvider(provider) && provider.provide === provider.useExisting) {
      throw Error(`A provider with "useExisting" cannot refer to itself`);
    }

    if (!isExistingProvider(provider) && this.singletons.has(token)) {
      throw Error(
        `Cannot bind a new provider for ${toString(token)}, since the existing provider was already constructed.`,
      );
    }

    const existingProviders = this.providers.get(token) ?? [];

    if (multi && existingProviders.some((it) => !isMultiProvider(it))) {
      // todo: should we be this strict, or only throw an error in mismatches upon retrieving?
      throw Error(
        `Cannot bind ${toString(token)} as multi-provider, since there is already a provider which is not a multi-provider.`,
      );
    } else if (!multi && existingProviders.some((it) => isMultiProvider(it))) {
      throw Error(
        `Cannot bind ${toString(token)} as provider, since there are already provider(s) that are multi-providers.`,
      );
    }

    if (multi) {
      this.providers.set(token, [...existingProviders, provider]);
    } else {
      if (existingProviders.length > 0) {
        // todo: log warning, since we're overwriting a provider?
        //  alternatively, provide both .bind() and .rebind() semantics?
      }

      this.providers.set(token, [provider]);
    }

    // todo: should support eagerly resolved providers or not?

    return this;
  }

  get<T>(token: Token<T>, options: { multi: true }): T[];
  get<T>(token: Token<T>, options: { optional: true }): T | undefined;
  get<T>(token: Token<T>, options: { multi: true; optional: true }): T[] | undefined;
  get<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T;
  get<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T | T[] | undefined {
    this.autoBindIfNeeded(token);

    if (!this.providers.has(token)) {
      if (options?.optional) {
        return undefined;
      }
      throw Error(`No provider(s) found for ${toString(token)}`);
    }

    const providers = assertPresent(this.providers.get(token));

    if (!this.singletons.has(token)) {
      if (providers.some(isAsyncFactoryProvider)) {
        throw new Error(
          `One or more providers for token ${toString(token)} are async, please use injectAsync() or container.getAsync() instead`,
        );
      }

      this.singletons.set(
        token,
        providers.map((it) => construct(it, this)),
      );
    }

    if (options?.multi) {
      return assertPresent(this.singletons.get(token));
    } else {
      return assertPresent(this.singletons.get(token)?.at(0));
    }
  }

  async getAsync<T>(token: Token<T>, options: { multi: true }): Promise<T[]>;
  async getAsync<T>(token: Token<T>, options: { optional: true }): Promise<T | undefined>;
  async getAsync<T>(token: Token<T>, options: { multi: true; optional: true }): Promise<T[] | undefined>;
  async getAsync<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): Promise<T>;
  async getAsync<T>(
    token: Token<T>,
    options?: {
      optional?: boolean;
      multi?: boolean;
    },
  ): Promise<T | T[] | undefined> {
    this.autoBindIfNeeded(token);

    if (!this.providers.has(token)) {
      if (options?.optional) {
        return Promise.resolve(undefined);
      }
      throw Error(`No provider(s) found for ${toString(token)}`);
    }

    const existingProviders = this.providers.get(token) ?? [];

    if (!this.singletons.has(token)) {
      const values = await Promise.all(existingProviders.map((it) => constructAsync(it, this)));
      this.singletons.set(token, values);
    }

    if (options?.multi) {
      return Promise.all(assertPresent(this.singletons.get(token)).map((it) => promisify(it)));
    } else {
      return promisify(assertPresent(this.singletons.get(token)?.at(0)));
    }
  }

  private autoBindIfNeeded<T>(token: Token<T>) {
    if (this.singletons.has(token)) {
      return;
    }

    if (isClassToken(token) && isInjectable(token)) {
      const targetClasses = getInjectableTargets(token);

      targetClasses
        .filter((targetClass) => !this.providers.has(targetClass))
        .forEach((targetClass) => {
          this.bind({
            provide: targetClass,
            multi: true,
            useClass: targetClass,
          });
        });

      targetClasses
        .filter((it) => it !== token)
        .forEach((targetClass) => {
          this.bind({
            provide: token,
            multi: true,
            useExisting: targetClass,
          });
        });
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

let currentScope: Container | undefined = undefined;

export function inject<T>(token: Token<T>, options: { optional: true }): T | undefined;
export function inject<T>(token: Token<T>): T;
export function inject<T>(token: Token<T>, options?: { optional: boolean }): T | undefined {
  if (currentScope === undefined) {
    throw new Error("You can only invoke inject() from the injection context");
  }
  return currentScope.get(token, options);
}

export function injectAsync<T>(token: Token<T>, options: { optional: true }): Promise<T | undefined>;
export function injectAsync<T>(token: Token<T>): Promise<T>;
export function injectAsync<T>(token: Token<T>, options?: { optional: boolean }): Promise<T | undefined> {
  if (currentScope === undefined) {
    throw new Error("You can only invoke injectAsync() from the injection context");
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

async function constructAsync<T>(provider: Provider<T>, scope: Container): Promise<T> {
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

function doConstruct<T>(provider: Provider<T>, scope: Container): T | Promise<T> {
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

interface ProviderMap extends Map<Token<unknown>, Provider<unknown>[]> {
  get<T>(key: Token<T>): Provider<T>[] | undefined;

  set<T>(key: Token<T>, value: Provider<T>[]): this;
}

interface SingletonMap extends Map<Token<unknown>, unknown[]> {
  get<T>(token: Token<T>): T[] | undefined;

  set<T>(token: Token<T>, value: T[]): this;
}

export function bootstrap<T>(token: Token<T>): T {
  return new Container().get(token);
}

export function bootstrapAsync<T>(token: Token<T>): Promise<T> {
  return new Container().getAsync(token);
}

function assertPresent<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }
  return value;
}
