
# Injection

In most cases you may want to inject your dependencies inside a class.
There are several ways to do this.

## Constructor injection

Needle DI strongly recommends **constructor injection**, since it makes the dependencies
of your class explicit, more type-safe, and allows for easier unit testing.

Instead of using `container.get(token)`, you can use the `inject(token)` function here,
so no reference to an actual container is needed.

```typescript
import { inject, injectable } from "@needle-di/core";

@injectable()
class MyService {
  constructor(
    private fooService = inject(FooService),
    private barService = inject(BarService),
    //      ^? Type will be inferred as `BarService`
  ) {}

  // ...
}
```

> [!TIP]
> If you don't know what a **token** is: consider it the unique reference for your binding. In this case, its just the
> class reference, but there are many more tokens possible.
>
> Learn more about [tokens](./tokens).

> [!NOTE]
> Needle DI uses **default parameter values** for constructor injection. This maximizes type-safety and removes the need
> for parameter decorators, which [aren't yet standardized][parameter decorators] in ECMAScript.
>
> Although experimental parameter decorators allow for static analysis,
> this design was chosen on purpose to reduce complexity and bundle size.

## Initializer injection

Alternatively, you can also initialize your dependencies as (private) fields:

```typescript
import { inject, injectable } from "@needle-di/core";

@injectable()
class MyService {
  private fooService = inject(FooService);
  private barService = inject(BarService);
  //      ^? Type will be inferred as `BarService`

  // ...
}
```
Although this is less verbose, this will not allow you to pass in those dependencies when you construct the cass manually, e.g. in unit tests.

## About the `inject()` function

Note that the `inject()` function is only available in the "injection context":

- During construction of a class being instantiated by the DI container;
- In the initializer for fields of such classes;
- In a factory function specified for `useFactory` of a provider;
- In the `factory` function specified for an `InjectionToken`.

If you try to use this function outside this context, it will throw
an error. This is because Needle DI needs a reference to a DI container when
constructing services globally.

[parameter decorators]: https://github.com/tc39/proposal-class-method-parameter-decorators
