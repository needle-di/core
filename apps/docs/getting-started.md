---
outline: deep
---

# Getting started

## Installation

Just install it using your favorite package manager.

Needle DI is published to [NPM](https://www.npmjs.com/package/@needle-di/core) and [JSR](https://jsr.io/@needle-di/core), 
and is also compatible with [Deno](https://deno.com/).

::: code-group
```bash [npm]
npm install @needle-di/core
```

```bash [yarn]
yarn add @needle-di/core
```

```bash [pnpm]
pnpm install @needle-di/core
```

```bash [deno]
deno add jsr:@needle-di/core
```
:::

## Transpiler settings

Needle DI uses native [ECMAScript decorators](https://github.com/tc39/proposal-decorators), which are currently in
[stage 3] of the TC39 standardization process.

[stage 3]: https://github.com/tc39/proposals#stage-3

If you're using Deno, you can run your code as-is. However, when running on Node.js or in a browser,
you might need to transpile your code first, as your runtime might [not have implemented it yet](https://github.com/tc39/proposal-decorators/issues/476).

Make sure to use `ES2022` or lower as target:

::: code-group
```json [tsc (tsconfig.json)]
{
  "compilerOptions": {
    "target": "ES2022"
  }
}
```

```javascript [vite (vite.config.mjs)]
export default defineConfig({
  esbuild: {
    target: 'es2022',
    // ...
  },
  // ...
});
```

```bash [esbuild]
esbuild app.js --target=es2022
```
:::


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
