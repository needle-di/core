import type { Token } from "./tokens.js";
import { type Class, isClass } from "./utils.js";

export type Provider<T> =
  | ConstructorProvider<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | AsyncFactoryProvider<T>
  | ExistingProvider<T>;

export type ConstructorProvider<T> = Class<T>;

export interface ClassProvider<T> {
  provide: Token<T>;
  useClass: Class<T>;
  multi?: true;
}

export interface ValueProvider<T> {
  provide: Token<T>;
  useValue: T;
  multi?: true;
}

export interface FactoryProvider<T> {
  provide: Token<T>;
  async?: false;
  multi?: true;
  useFactory: () => NoInfer<T>;
}

export interface AsyncFactoryProvider<T> {
  provide: Token<T>;
  async: true;
  multi?: true;
  useFactory: () => Promise<NoInfer<T>>;
}

export interface ExistingProvider<T> {
  provide: Token<T>;
  useExisting: Token<T>;
  multi?: boolean;
}

export function isConstructorProvider<T>(provider: Provider<T>): provider is ConstructorProvider<T> {
  return isClass(provider);
}

export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
  return "provide" in provider && "useClass" in provider;
}

export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "provide" in provider && "useValue" in provider;
}

export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> | AsyncFactoryProvider<T> {
  return "provide" in provider && "useFactory" in provider;
}

export function isAsyncFactoryProvider<T>(provider: Provider<T>): provider is AsyncFactoryProvider<T> {
  return isFactoryProvider(provider) && (provider.async ?? false);
}

export function isMultiProvider<T>(provider: Provider<T>): boolean {
  return "provide" in provider && "multi" in provider && provider.multi === true;
}

export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return "provide" in provider && "useExisting" in provider;
}
