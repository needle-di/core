import type { Token } from "./tokens.js";
import { type Class, isClassLike } from "./utils.js";

/**
 * A provider states how, for a given token, a service should be constructed.
 */
export type Provider<T> =
  | ConstructorProvider<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | AsyncFactoryProvider<T>
  | ExistingProvider<T>;

/**
 * A constructor provider refers to a class constructor,
 * which is the same class as the token itself.
 */
export type ConstructorProvider<T> = Class<T>;

/**
 * A class provider refers to a class constructor,
 * which may be the same class as the token, or a subclass.
 */
export interface ClassProvider<T> {
  provide: Token<T>;
  useClass: Class<NoInfer<T>>;
  multi?: true;
}

/**
 * A value provider refers to a static value.
 */
export interface ValueProvider<T> {
  provide: Token<T>;
  useValue: T;
  multi?: true;
}

/**
 * A factory provider refers to a value which is lazily returned
 * by a synchronous factory function.
 */
export interface FactoryProvider<T> {
  provide: Token<T>;
  async?: false;
  multi?: true;
  useFactory: () => NoInfer<T>;
}

/**
 * An async factory provider refers to a value which is lazily returned
 * by an asynchronous factory function.
 */
export interface AsyncFactoryProvider<T> {
  provide: Token<T>;
  async: true;
  multi?: true;
  useFactory: () => Promise<NoInfer<T>>;
}

/**
 * An existing provider refers to a value provided by another provider.
 */
export interface ExistingProvider<T> {
  provide: Token<T>;
  useExisting: Token<T>;
  multi?: boolean;
}

export function isConstructorProvider<T>(provider: Provider<T>): provider is ConstructorProvider<T> {
  return isClassLike(provider);
}

export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
  return "provide" in provider && "useClass" in provider;
}

export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "provide" in provider && "useValue" in provider;
}

export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return "provide" in provider && "useFactory" in provider && !provider.async;
}

export function isAsyncFactoryProvider<T>(provider: Provider<T>): provider is AsyncFactoryProvider<T> {
  return "provide" in provider && "useFactory" in provider && provider.async === true;
}

export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return "provide" in provider && "useExisting" in provider;
}

export function isMultiProvider<T>(provider: Provider<T>): boolean {
  return "provide" in provider && "multi" in provider && provider.multi === true;
}

export function existingProviderAlreadyDefined(token: Token<unknown>, providers: Provider<unknown>[]) {
  return providers.some(it => isExistingProvider(it) && (it.useExisting === token || it.provide === token));
}
