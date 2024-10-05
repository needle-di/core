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
import { assertPresent, getParentClasses, windowedSlice } from "./utils.js";

/**
 * A dependency injection (DI) container will keep track of all bindings
 * and hold the actual instances of your services.
 */
export class Container {
  private readonly providers: ProviderMap = new Map();
  private readonly singletons: SingletonMap = new Map();

  public bindAll<A>(p1: Provider<A>): this;
  public bindAll<A, B>(p1: Provider<A>, p2: Provider<B>): this;
  public bindAll<A, B, C>(p1: Provider<A>, p2: Provider<B>, p3: Provider<C>): this;
  public bindAll<A, B, C, D>(p1: Provider<A>, p2: Provider<B>, p3: Provider<C>, p4: Provider<D>): this;
  public bindAll<A, B, C, D, E>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
  ): this;
  public bindAll<A, B, C, D, E, F>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
  ): this;
  public bindAll<A, B, C, D, E, F, G>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
  ): this;
  public bindAll<A, B, C, D, E, F, G, H>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
    p8: Provider<H>,
  ): this;
  public bindAll<A, B, C, D, E, F, G, H, I>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
    p8: Provider<H>,
    p9: Provider<I>,
  ): this;
  public bindAll<A, B, C, D, E, F, G, H, I>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
    p8: Provider<H>,
    p9: Provider<I>,
    // eslint-disable-next-line
    ...providers: Provider<any>[]
  ): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public bindAll(...providers: Provider<any>[]): this {
    providers.forEach((it) => this.bind(it));
    return this;
  }

  public bind<T>(provider: Provider<T>): this {
    const token = isConstructorProvider(provider) ? provider : provider.provide;
    const multi = isMultiProvider(provider);

    if (isExistingProvider(provider) && provider.provide === provider.useExisting) {
      throw Error(`The provider for token ${toString(token)} with "useExisting" cannot refer to itself.`);
    }

    if (!isExistingProvider(provider) && this.singletons.has(token)) {
      throw Error(
        `Cannot bind a new provider for ${toString(token)}, since the existing provider was already constructed.`,
      );
    }

    const existingProviders = this.providers.get(token) ?? [];

    // ignore this provider if it was already provided as existingProvider
    if (
      isExistingProvider(provider) &&
      isMultiProvider(provider) &&
      this.existingProviderAlreadyProvided(token, provider.useExisting)
    ) {
      return this;
    }

    if (multi && existingProviders.some((it) => !isMultiProvider(it))) {
      throw Error(
        `Cannot bind ${toString(token)} as multi-provider, since there is already a provider which is not a multi-provider.`,
      );
    } else if (!multi && existingProviders.some((it) => isMultiProvider(it))) {
      if (!existingProviders.every(isExistingProvider)) {
        throw Error(
          `Cannot bind ${toString(token)} as provider, since there are already provider(s) that are multi-providers.`,
        );
      }
    }

    this.providers.set(token, multi ? [...existingProviders, provider] : [provider]);

    // inheritance support: also bind parent classes to their immediate child classes
    if (isClassToken(token) && (isClassProvider(provider) || isConstructorProvider(provider))) {
      windowedSlice([token, ...getParentClasses(token)]).forEach(([childClass, parentClass]) => {
        const parentProvider: Provider<typeof childClass> = {
          provide: parentClass,
          useExisting: childClass,
          multi: true,
        };
        const existingParentProviders = this.providers.get(parentClass) ?? [];
        if (!this.existingProviderAlreadyProvided(parentClass, childClass)) {
          this.providers.set(parentClass, [...existingParentProviders, parentProvider]);
        }
      });
    }

    return this;
  }

  public get<T>(token: Token<T>, options: { multi: true }): T[];
  public get<T>(token: Token<T>, options: { optional: true }): T | undefined;
  public get<T>(token: Token<T>, options: { multi: true; optional: true }): T[] | undefined;
  public get<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T;
  public get<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T | T[] | undefined {
    this.autoBindIfNeeded(token);

    const optional = options?.optional ?? false;
    const multi = options?.multi ?? false;

    if (!this.providers.has(token)) {
      if (optional) {
        return undefined;
      }
      throw Error(`No provider(s) found for ${toString(token)}`);
    }

    const providers = assertPresent(this.providers.get(token));

    if (!this.singletons.has(token)) {
      if (providers.some(isAsyncFactoryProvider)) {
        throw new AsyncProvidersInSyncInjectionContextError(token);
      }

      this.singletons.set(
        token,
        providers.flatMap((it) => this.construct(it, this)),
      );
    }

    const singletons = assertPresent(this.singletons.get(token));

    if (multi) {
      return singletons;
    } else if (singletons.length > 1) {
      throw Error(
        `Requesting a single value for ${toString(token)}, but multiple values were provided. ` +
          `Consider passing "{ multi: true }" to inject all values, or adjust your bindings accordingly.`,
      );
    } else {
      return assertPresent(singletons.at(0));
    }
  }

  public async getAsync<T>(token: Token<T>, options: { multi: true }): Promise<T[]>;
  public async getAsync<T>(token: Token<T>, options: { optional: true }): Promise<T | undefined>;
  public async getAsync<T>(token: Token<T>, options: { multi: true; optional: true }): Promise<T[] | undefined>;
  public async getAsync<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): Promise<T>;
  public async getAsync<T>(
    token: Token<T>,
    options?: {
      optional?: boolean;
      multi?: boolean;
    },
  ): Promise<T | T[] | undefined> {
    this.autoBindIfNeeded(token);

    const optional = options?.optional ?? false;
    const multi = options?.multi ?? false;

    if (!this.providers.has(token)) {
      if (optional) {
        return undefined;
      }
      throw Error(`No provider(s) found for ${toString(token)}`);
    }

    const existingProviders = this.providers.get(token) ?? [];

    if (!this.singletons.has(token)) {
      const values = await Promise.all(existingProviders.map((it) => this.constructAsync(it, this)));
      this.singletons.set(token, values.flat());
    }

    const singletons = assertPresent(this.singletons.get(token));
    if (multi) {
      return Promise.all(singletons.map(promisify));
    } else if (singletons.length > 1) {
      throw Error(
        `Requesting a single value for ${toString(token)}, but multiple values were provided. ` +
          `Consider passing "{ multi: true }" to inject all values, or adjust your bindings accordingly.`,
      );
    } else {
      return promisify(singletons.at(0));
    }
  }

  private construct<T>(provider: Provider<T>, scope: Container): T[] {
    const originalScope = currentScope;
    try {
      currentScope = scope;
      return doConstruct(provider, scope);
    } finally {
      currentScope = originalScope;
    }
  }

  private async constructAsync<T>(provider: Provider<T>, scope: Container): Promise<T[]> {
    const originalScope = currentScope;
    try {
      currentScope = scope;
      return await this.doConstructAsync(provider, scope);
    } finally {
      currentScope = originalScope;
    }
  }

  private async doConstructAsync<T>(provider: Provider<T>, scope: Container): Promise<T[]> {
    if (isAsyncFactoryProvider(provider)) {
      return [await provider.useFactory()];
    } else if (isExistingProvider(provider)) {
      return scope.getAsync(provider.useExisting, { multi: true });
    } else if (isClassProvider(provider) || isConstructorProvider(provider)) {
      while (true) {
        try {
          return doConstruct(provider, scope);
        } catch (error) {
          if (error instanceof AsyncProvidersInSyncInjectionContextError) {
            const values = await injectAsync(error.token, { multi: true, optional: true });
            if (values) {
              this.singletons.set(error.token, values);
            }
          } else {
            throw error;
          }
        }
      }
    } else {
      return doConstruct(provider, scope);
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
            useClass: targetClass,
            multi: true,
          });
        });
    } else if (!this.providers.has(token) && isInjectionToken(token) && token.options?.factory) {
      const async = token.options.async;
      if (!async) {
        this.bind({
          provide: token,
          async: false,
          useFactory: token.options.factory,
        });
      } else if (async) {
        this.bind({
          provide: token,
          async: true,
          useFactory: token.options.factory,
        });
      }
    }
  }

  private existingProviderAlreadyProvided(token: Token<unknown>, existingToken: Token<unknown>) {
    return (this.providers.get(token) ?? []).some(
      (it) => isExistingProvider(it) && it.provide === token && it.useExisting === existingToken,
    );
  }
}

let currentScope: Container | undefined = undefined;

/**
 * Injects a service within the current injection context, using the token provided.
 */
export function inject<T>(token: Token<T>, options: { multi: true }): T[];
export function inject<T>(token: Token<T>, options: { optional: true }): T | undefined;
export function inject<T>(token: Token<T>, options: { multi: true; optional: true }): T[] | undefined;
export function inject<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T;
export function inject<T>(token: Token<T>, options?: { optional?: boolean; multi?: boolean }): T | T[] | undefined {
  if (currentScope === undefined) {
    if (options?.optional) return undefined;
    throw new Error("You can only invoke inject() from the injection context");
  }
  return currentScope.get(token, options);
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
  if (currentScope === undefined) {
    if (options?.optional) return undefined;
    throw new Error("You can only invoke injectAsync() from the injection context");
  }
  return currentScope.getAsync(token, options);
}

// see: https://github.com/tc39/proposal-promise-try
async function promisify<T>(value: T | Promise<T>): Promise<T> {
  return new Promise<T>((resolve) => resolve(value));
}

function doConstruct<T>(provider: Provider<T>, scope: Container): T[] {
  if (isConstructorProvider(provider)) {
    return [new provider()];
  } else if (isClassProvider(provider)) {
    return [new provider.useClass()];
  } else if (isValueProvider(provider)) {
    return [provider.useValue];
  } else if (isFactoryProvider(provider)) {
    return [provider.useFactory()];
  } else if (isAsyncFactoryProvider(provider)) {
    throw Error("Invalid state");
  } else {
    return scope.get(provider.useExisting, { multi: true });
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

/**
 * Bootstraps a new container and obtains a service using the provided token.
 */
export function bootstrap<T>(token: Token<T>): T {
  return new Container().get(token);
}

/**
 * Bootstraps a new container and obtains a service asynchronously using the provided token.
 */
export function bootstrapAsync<T>(token: Token<T>): Promise<T> {
  return new Container().getAsync(token);
}

/**
 * An error that occurs when an async provider is requested in a synchronous context.
 *
 * @internal
 */
class AsyncProvidersInSyncInjectionContextError<T> extends Error {
  constructor(public token: Token<T>) {
    super(
      `Some providers for token ${toString(token)} are async, please use injectAsync() or container.getAsync() instead`,
    );
  }
}
