// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: any[]) => T;

export interface AbstractClass<T> {
  prototype: T;
  name: string;
}

/**
 * Type-guard to assert if the given object is an (abstract) class.
 *
 * @internal
 */
export function isClassLike(target: unknown): target is Class<unknown> | AbstractClass<unknown> {
  return typeof target === "function";
}

/**
 * Returns all parent classes of a given class.
 *
 * @internal
 */
export function getParentClasses(target: Class<unknown>): Class<unknown>[] {
  const parentClasses: Class<unknown>[] = [];
  let currentClass = target;
  while (Object.getPrototypeOf(currentClass).name) {
    const parentClass: Class<unknown> = Object.getPrototypeOf(currentClass);
    parentClasses.push(parentClass);
    currentClass = parentClass;
  }
  return parentClasses;
}

/**
 * Ensures a given value is not null or undefined.
 *
 * @internal
 */
export function assertPresent<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }
  return value;
}

/**
 * @internal
 */
export function windowedSlice<T>(array: T[], step?: 2): [T, T][];
export function windowedSlice<T>(array: T[], step: number): T[][];
export function windowedSlice<T>(array: T[], step = 2): T[][] {
  const result: T[][] = [];
  array.some((_, i) => {
    if (i + step > array.length) return true;
    result.push(array.slice(i, i + step));
  });
  return result;
}

/**
 * Retries as long as it encounters any error that is instance of `errorClass`.
 * Awaits the result of the `onError` callback before retrying.
 */
export async function retryOn<TError, TReturn>(
  errorClass: Class<TError>,
  block: () => Promise<TReturn>,
  onError: (error: TError) => Promise<void>,
): Promise<TReturn> {
  while (true) {
    try {
      return await block();
    } catch (error) {
      if (!(error instanceof errorClass)) {
        throw error;
      }
      await onError(error);
    }
  }
}

/**
 * Assert that there is a single element in an array. Throws the error from error provider if not.
 */
export function assertSingle<T>(array: T[], errorProvider: () => unknown): T {
  if (array.length > 1) {
    throw errorProvider();
  }
  const first = array.at(0);
  if (first === undefined) {
    throw errorProvider();
  }

  return first;
}

/**
 * Type-guard for `never` types, can be used to create exhaustive branches.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertNever(_: never): never {
  throw new Error("invalid state");
}
