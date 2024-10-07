---
outline: deep
---

# Getting started

Just install it using your favorite package manager.

```bash
npm install --save @needle-di/core
```

Needle DI also works with [Deno](https://deno.com/) and is distributed on [JSR](https://jsr.io/@needle-di/core) as well.

```bash
 deno add @needle-di/core
 ```

## Basic example

Here’s a simple example using constructor injection to inject one service into another.

```typescript
import { injectable, inject } from "@needle-di/core";

@injectable()
class FooService {
    // ...
}

@injectable()
class BarService {
  constructor(private fooService = inject(FooService)) {}
  //                  ^? Type will be inferred as `FooService`
}
```
As you can see, Needle DI uses default parameter values for constructor injection.

The `@injectable` decorator eliminates the need to register services manually. To construct the `BarService`, you have 
to create a dependency injection container, and use the `container.get()` method:

```typescript
import { Container } from "@needle-di/core";

const container = new Container();
const barService = container.get(BarService);
//    ^? Type will be inferred as `BarService`
```

That's it!

## What's next?

Check out the [concepts](/concepts/binding) to learn more and see more examples.
