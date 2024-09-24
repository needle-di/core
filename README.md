# Needle DI 💉

> A lightweight, type-safe Dependency Injection (DI) library for JavaScript and TypeScript projects.

[![NPM version](http://img.shields.io/npm/v/@dirkluijk/needle-di.svg?style=flat-square)](https://www.npmjs.com/package/@dirkluijk/needle-di)
[![NPM downloads](http://img.shields.io/npm/dm/@dirkluijk/needle-di.svg?style=flat-square)](https://www.npmjs.com/package/@dirkluijk/needle-di)
[![Build status](https://github.com/dirkluijk/needle-di/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/dirkluijk/needle-di/actions/workflows/main.yml)

Needle DI is a lightweight, TypeScript-first library for dependency injection (DI). It is designed to be both easy to use and highly efficient.

### Key Features

- Stand-alone: No additional dependencies required
- Intended for both JavaScript-only and TypeScript projects
- Supports [tree-shakeable injection tokens](#tree-shakeable-injection-tokens): optimize your builds for production.
- Inspired by [Angular](https://angular.dev/) and [InversifyJS](https://github.com/inversify/InversifyJS), familiar to developers coming from these frameworks.
- Uses native [ECMAScript TC39 decorators](https://github.com/tc39/proposal-decorators) (currently stage 3)
- No need for `experimentalDecorators` and `emitDecoratorMetadata`
- No reflection libraries needed, like `reflect-metadata` or other reflection mechanisms.

## Basic example

Here’s a simple example using constructor injection to inject one service into another.

```typescript
import { injectable, inject } from "@dirkluijk/needle-di";

@injectable()
class FooService {}

@injectable()
class BarService {
  constructor(private fooService = inject(FooService)) {}
  //                  ^? Type will be inferred as `FooService`
}
```

The `@injectable` decorator eliminates the need to manually register services. To construct the `BarService`, create a
dependency injection container, and use the `container.get()` method:

```typescript
import { Container } from "@dirkluijk/needle-di";

const container = new Container();
const barService = container.get(BarService);
//    ^? Type will be inferred as `BarService`
```

If you don't need to interact with the DI container at all, you can also use the `bootstrap()` shorthand function
instead.
This will internally create a new container and return the constructed service:

```typescript
import { bootstrap } from "@dirkluijk/needle-di";

const barService = bootstrap(BarService);
```

Check out the [usage](#usage) section below to learn more!

## Not (yet) supported

- Transient scope (although you could provide a factory function instead)
- Nested DI containers
- Unbinding providers

Please refer to the [usage](#usage) section below to see what's included!

If you want to request a missing feature, feel free to submit an issue to explain your use case.

## Installation

```
npm install @dirkluijk/needle-di
```

## Usage

### Auto-binding (using decorators)

The easiest way to use Needle DI is by using the `@injectable()` decorator.

```typescript
import { injectable } from "@dirkluijk/needle-di";

@injectable()
class FooService {
  // ...
}
```

This will automatically bind `FooService` as a singleton service.

Its construction is lazy: it will only be created when you request it from the container. The first time a `FooService`
is injected, a
new instance is constructed, and it will reuse this instance whenever it needs to be injected again.

> Note: since Needle DI uses native [ECMAScript TC39 decorators](https://github.com/tc39/proposal-decorators)
> (which is currently in Stage 3), you will need to transpile your code in order to use it in a browser or in Node.JS.
>
> All modern transpilers (including TypeScript, Esbuild, Webpack, Babel) do have support for decorators. If you don't
> want to depend on transpilation, you can bind your services [manually](#manual-binding) instead, without using
> decorators.

### Creating the DI container

The dependency injection container will keep track of all bindings and hold the actual instances of your services. To
create it, simply construct one:

```typescript
import { Container } from "@dirkluijk/needle-di";

const container = new Container();
```

### Injection

To obtain something from the container, you can use `container.get(token)`:

```typescript
const fooService = container.get(FooService);
//    ^? Type will be inferred as `FooService`
```

This is useful when you need something outside of a class, but will require a reference to your container.

> If you don't know what a **token** is: consider it the unique reference for your binding. In this case, its just the
> class reference, but there are many more tokens possible. Read more about [injection tokens](#injection-tokens) below.

In most cases however, you probably want to inject your dependencies inside a class constructor.
Instead of using `container.get(token)`, you can use the `inject()` function here:

```typescript
import { inject, injectable } from "@dirkluijk/needle-di";

@injectable()
class MyService {
  constructor(
    private fooService = inject(FooService),
    //      ^? Type will be inferred as `FooService`
    private barService = inject(BarService),
    //      ^? Type will be inferred as `BarService`
  ) {}

  // ...
}
```

Note that the `inject()` function is only available in the "injection context":

- During construction of a class being instantiated by the DI container;
- In the initializer for fields of such classes;
- In a factory function specified for `useFactory` of a provider;
- In the `factory` function specified for an `InjectionToken`;

> Needle DI uses **default parameter values** for constructor injection. This maximizes type-safety and removes the need
> for parameter decorators, which aren't yet standardized in ECMAScript.

### Manual binding

To manually bind (register) something to your DI container, you will need to understand the concepts:

- A **service** is whatever you want the DI container to create;
- A **token** is the unique reference for that service;
- A **provider** states how the service should be created.

For example:

```typescript
import { Container } from "@dirkluijk/needle-di";

const container = new Container();

container.bind({
  provide: MyService,
  useValue: new MyService(),
});
```

In this case, `MyService` is the token, and `useValue: new MyService()` is the provider and states how the value will be
created.

### Types of providers

There are different types of providers:

#### 1. Class provider

A class provider refers to a class constructor, which will be used construct a new instance.

```typescript
container.bind({
  provide: Logger,
  useClass: Logger,
});
```

This example can also be written with the shorthand:

```typescript
container.bind(Logger);
```

This will register a singleton for `Logger` that gets lazily constructed.

However, `useClass` may also refer to a child class of `Logger`:

```typescript
container.bind({
  provide: Logger,
  useClass: FileLogger,
});
```

Check out [inheritance support](#inheritance-support) for more information.

#### 2. Value provider

A value provider refers to a static value.

```typescript
container.bind({
  provide: MyService,
  useValue: new MyService(),
});
```

This will bind the provided value to the token. This value will act as a singleton and will be reused.
Note that this value is created, regardless of whether it is used.

#### 3. Factory provider

A factory provider refers to a factory function, which will only be invoked when this token gets injected for its first
time.
This makes it ideal for lazy evaluation.

```typescript
container.bind({
  provide: MyService,
  useFactory: () => new MyService(),
});
```

The value returned by the function will act as a singleton and will be reused.

Note that you can use the `inject()` function inside this factory function, allowing you to inject other dependencies:

```typescript
container.bind({
  provide: MyService,
  useFactory: () => new MyService(inject(FooService), inject(BarService)),
});
```

#### 4. Existing provider

An existing provider is a special provider that refers to another provider, by specifying its token.
This basically works like an alias. This can be useful for inheritance or [injection tokens](#injection-tokens).

```typescript
container.bind({
  provide: MyValidator,
  useClass: MyValidator,
});

container.bind({
  provide: VALIDATOR,
  useExisting: MyValidator,
});
```

In this case, both `inject(MyValidator)` and `inject(VALIDATOR)` would inject the same instance.

### Injection tokens

In most of the examples above, we used a class reference as token.
However, this is not always suitable, for example, when you want to provide a primitive value or object literal.

> Note that TypeScript interfaces only exist compile-time and **cannot** be used as a token.

In such cases, you could use a `string` (or a `symbol`):

```typescript
container.bind({
  provide: "my-magic-number",
  useValue: 42,
});

container.bind({
  provide: "my-config",
  useFactory: {
    foo: "bar",
  },
});

const myNumber = container.get<number>("my-magic-number");
const myConfig = container.get<MyConfig>("my-config");
```

However, in this case it will not infer the types, unless you provide the generic type yourself. This can easily
lead to inconsistency and mistakes.

A better alternative is to use an `InjectionToken<T>`. This is basically a unique token object, holding the generic
type.

```typescript
import { InjectionToken } from "@dirkluijk/needle-di";

const MY_NUMBER = new InjectionToken<number>("MY_NUMBER");
const MY_CONFIG = new InjectionToken<MyConfig>("MY_CONFIG");

container.bind({
  provide: MY_NUMBER,
  useValue: 42,
  //        ^? should be `number`
});

container.bind({
  provide: MY_CONFIG,
  useValue: { foo: "bar" },
  //        ^? should be `MyConfig`
});

const myNumber = container.get(MY_NUMBER);
//       ^? Type will be inferred as `number`
const myConfig = container.get(MY_CONFIG);
//       ^? Type will be inferred as `MyConfig`
```

This maximizes type-safety since both `container.bind()`, `container.get()` and `inject()` will check and infer the
types associated with the injection token.

This is not the only benefit: it also enables tree-shakable tokens.

### Tree-shakeable injection tokens

There is also the option to provide a `factory` function in your `InjectionToken`:

```typescript
import { InjectionToken } from "@dirkluijk/needle-di";

const MY_NUMBER = new InjectionToken<number>("MY_NUMBER", {
  factory: () => 42,
});

const MY_CONFIG = new InjectionToken<MyConfig>("MY_CONFIG", {
  factory: () => ({
    foo: "bar",
  }),
});

const myNumber = container.get(MY_NUMBER);
const myConfig = container.get(MY_CONFIG);
```

First, this will enable auto-binding: there is no need anymore to manually register these tokens in your container.
Since it holds a factory function, the container can automatically bind and construct them when you request them
for the first time.

Furthermore, it will also make your tokens **tree-shakeable**: if you use a build tool that supports tree-shaking,
and there are no references to your injection token, everything associated with your token will be removed from your
transpiled code. This is useful if your factory function creates something with a heavy bundle size, e.g.
something from a big library.

### Optional injection

By default, when you try to inject something that isn't provided, it will throw an error.

Alternatively, you can use optional injection, by passing `{ optional: true }`. Instead of throwing an error, it will
now return `undefined`:

```typescript
import { inject } from "@dirkluijk/needle-di";

class MyService {
  constructor(
    private fooService = inject(FooService),
    //      ^? Type will be inferred as `FooService`
    private barService = inject(BarService, { optional: true }),
    //      ^? Type will be inferred as `BarService | undefined`
  ) {}
}
```

When you construct an instance of `MyService` manually outside the injection context, and you don't pass any argument
for
`barService`, the `inject()` function will automatically return `undefined` since it is optional:

```typescript
const myService = new MyService(new FooService()); // will cause no issues
```

### Multi-injection

By default, when you reuse an existing token in a binding, it will overwrite any previous binding.

However, it is also possible to register multiple values for the same token:

```typescript
import { Container } from "@dirkluijk/needle-di";

const container = new Container();

container.bind({
  provide: FooService,
  multi: true,
  factory: () => new FooService(123, "abc"),
});

container.bind({
  provide: FooService,
  multi: true,
  factory: () => new FooService(456, "def"),
});
```

To inject both instances, you can pass `{ multi: true }` to the `inject()` function:

```typescript
class MyService {
  constructor(
    private fooServices = inject(FooService, { multi: true }),
    //      ^? Type will be inferred as `FooService[]`
  ) {}
}
```

There are some rules associated with multi-providers:

- It is not possible to intermix providers with `multi: false` and `multi: true` for the same token.
- When you specify only a single provider with `multi: true`, you can still inject it as a single instance.
- When you specify multiple providers with `multi: true`, it will throw an error when you try to inject a single
  instance.
- When you try to inject with `multi: true` and `optional: true`, and there are no providers, it will still
  return `undefined` instead of an empty array.

### Inheritance support

Given the following class structure:

```typescript
abstract class ExampleService {
  /* ... */
}

@injectable()
class FooService extends ExampleService {
  /* ... */
}

@injectable()
class BarService extends ExampleService {
  /* ... */
}
```

This will automatically bind `FooService` and `BarService`, but it will also automatically
bind two multi-providers for the token `ExampleService`:

```typescript
const fooService = container.get(FooService);
const barService = container.get(BarService);

const myServices = container.get(ExampleService, { multi: true });
//    ^? Type will be inferred as `ExampleService[]`
//        and will be the same instances as "fooService" and "barService'
```

Under the hood, it is the same as:

```typescript
container.bindAll(
  {
    provide: FooService,
    useClass: FooService,
    multi: true,
  },
  {
    provide: BarService,
    useClass: BarService,
    multi: true,
  },
  {
    provide: MyAbstractService,
    useExisting: FooService,
    multi: true,
  },
  {
    provide: MyAbstractService,
    useExisting: BarService,
    multi: true,
  },
);
```

This even works with multiple levels of inheritance!

> Note: this only works with parent **classes**. If you're using TypeScript interfaces instead, you should manually bind
> multi-providers and use injection tokens.

### Async factory providers (experimental)

> Note: this feature is currently experimental, and has some limitations.

It is also possible to use a provider with an async factory function, by passing `async: true`.
You can create a provider that returns a promise, such as an async factory function:

```typescript
container.bind({
  provide: FooService,
  async: true,
  useFactory: async () => {
    // ... returning some `FooService` here
  },
});
```

Keep in mind, when you want to obtain this from the DI container, you will have to use `container.getAsync(token)` or
`injectAsync(token)`.

```typescript
const fooService = await container.getAsync(FooService);
```

If you try to use `container.get(token)` or `inject(token)` for an async provider, an error will be thrown,
as these methods only support synchronous injection. This restriction also applies if any indirect dependencies are async.

To handle this, inject a promise and resolve it when needed:

```typescript
class MyService {
  constructor(private getFooService: Promise<FooService> = injectAsync(FooService)) {}

  async someMethod() {
    const fooService: FooService = await this.getFooService;
    // ...
  }
}
```

### Workaround for async injection limitations

A possible workaround for this restriction is to construct your service eagerly and bind a static value instead:

```typescript
const fooService = await getFooService();

container.bind({
  provide: FooService,
  useValue: fooService,
});
```

By eagerly constructing the service and binding it as a static value, you can avoid the need to work with promises in your constructors.

## License

License under the MIT License (MIT)

Copyright (c) 2024 Dirk Luijk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

