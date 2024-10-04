
# Binding

**Binding** is the registration of your services into your dependency injection (DI)  container.

## Auto-binding

The easiest way to register your class for automatic dependency injection, is by
applying the `@injectable()` decorator to your class:

```typescript
import { injectable } from "@needle-di/core";

@injectable()
class FooService {
  // ...
}
```

This will automatically bind `FooService` as a singleton service. To request it from your service, 
you can use the `.get()` method on the [container](./containers):

```typescript
import { Container } from "@needle-di/core";

const container = new Container();
const fooService = container.get(FooService);
//    ^? Type will be inferred as `FooService`
```

* Its construction is **lazy**: it will only be created when you request it from the container.
* It is also a **singleton**: the first time a `FooService` is injected, a new instance is constructed, but it will reuse this instance whenever it needs to be injected again.

> [!NOTE]
> Since Needle DI uses native [ECMAScript TC39 decorators](https://github.com/tc39/proposal-decorators)
> (which is currently in [stage 3](https://github.com/tc39/proposals#stage-3)), you will need to transpile your code in order to use it in a browser or in Node.JS. 
> 
> All modern transpilers (including [TypeScript], [esbuild], [Webpack], [Babel]) do have support for stage 3 decorators. If you
> don't want to depend on transpilation, you can bind your services [manually](#manual-binding) instead, without using
> decorators.

[TypeScript]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators
[esbuild]: https://github.com/evanw/esbuild/releases/v0.21.0
[Webpack]: https://stackoverflow.com/a/37616418/1116452
[Babel]: https://stackoverflow.com/a/37616418/1116452

## Manual binding

If you don't want to use the `@injectable()` decorator, for example if you don't want to use decorators or you want to bind a 
class that you cannot decorate (from another library), you can manually register your service with the `.bind()` method:

```typescript
import { Container } from "@needle-di/core";

const container = new Container();

container.bind(FooService);

const fooService = container.get(FooService);
//    ^? Type will be inferred as `FooService`
```

This is the same as applying a decorator to `FooService`.

***

There are many different ways to bind services, 
check out the section about [providers](./providers) to learn more. 
