---
outline: deep
---

# Providers

There are many ways to register your services for dependency injection.

## Terminology

In the following section, we will use the following terms:

- A **service** is whatever you want the DI container to create;
- A **token** is the unique reference for that service;
- A **provider** states how the service should be created.

::: details Check an example
```typescript
import { Container } from "needle-di";

const container = new Container();

container.bind({
  provide: MyService,
  useValue: new MyService(),
});
```

In this case, `MyService` is the **token**, and `useValue: new MyService()` is the **provider** and states how the
**service** will be created.
:::

## Types of providers

There are different types of providers.

### Class providers

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

Check out [inheritance support](/advanced/inheritance) for more information.

### Value providers

A value provider refers to a static value.

```typescript
container.bind({
  provide: MyService,
  useValue: new MyService(),
});
```

This will bind the provided value to the token. This value will act as a singleton and will be reused.
Note that this value is created, regardless whether it is used.

### Factory providers

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

### Existing providers

An existing provider is a special provider that refers to another provider, by specifying its token.
This basically works like an alias. This can be useful for inheritance or [injection tokens](/concepts/tokens).

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

