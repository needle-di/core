import { type Provider, type SyncProvider } from "./providers.ts";
import { type Token, toString } from "./tokens.ts";
import * as Guards from "./providers.ts";
import { assertNever, retryOn } from "./utils.ts";
import { Container } from "./container.ts";

/**
 * @internal
 */
export class Factory {
  constructor(private readonly container: Container) {}

  construct<T>(provider: Provider<T>, token: Token<T>): T[] {
    if (Guards.isAsyncProvider(provider)) {
      throw new AsyncProvidersInSyncInjectionContextError(token);
    }

    return this.doConstruct(provider);
  }

  async constructAsync<T>(provider: Provider<T>): Promise<T[]> {
    if (Guards.isAsyncProvider(provider)) {
      return [await provider.useFactory(this.container)];
    }

    // in class and constructor providers, we allow stuff to be synchronously injected,
    // by just retrying when we encounter an async dependency down the road.
    // todo: this feels like an ugly workaround, so let's create something nice for this.
    if (Guards.isClassProvider(provider) || Guards.isConstructorProvider(provider)) {
      const create = Guards.isConstructorProvider(provider) ? () => [new provider()] : () => [new provider.useClass()];

      return retryOn(
        AsyncProvidersInSyncInjectionContextError,
        async () => create(),
        async (error) => {
          await this.container.getAsync(error.token, { multi: true, optional: true });
        },
      );
    }

    // all other types of providers are constructed synchronously anyway.
    return this.doConstruct(provider);
  }

  private doConstruct<T>(provider: SyncProvider<T>): T[] {
    if (Guards.isConstructorProvider(provider)) {
      return [new provider()];
    } else if (Guards.isClassProvider(provider)) {
      return [new provider.useClass()];
    } else if (Guards.isValueProvider(provider)) {
      return [provider.useValue];
    } else if (Guards.isFactoryProvider(provider)) {
      return [provider.useFactory(this.container)];
    } else if (Guards.isExistingProvider(provider)) {
      return this.container.get(provider.useExisting, { multi: true });
    }

    return assertNever(provider);
  }
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
