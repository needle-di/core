# Async injection (experimental)

It is also possible to use a provider with an async factory function.

> [!CAUTION]
> This feature is currently **experimental** and has some limitations.

## Async factory providers

All you have to do, is passing `async: true`. This will require you to return a `Promise` in your factory function.
This allows you to also use an `async` function:

```typescript
container.bind({
  provide: FooService,
  async: true,
  useFactory: async () => {
    // ... returning some `FooService` here
  },
});
```

## `getAsync()` and `injectAsync()`

When you want to obtain this from the DI container, you will have to use `container.getAsync(token)` or
`injectAsync(token)`. Since this returns a `Promise`, you can use `await` here.

```typescript
const fooService = await container.getAsync(FooService);
```

If you try to use `container.get(token)` or `inject(token)` for an async provider, an error will be thrown,
as these methods only support synchronous injection. This restriction also applies if any indirect dependencies are async.

## Constructor injection

Just inject it using `injectAsync()` and resolve the promise when needed:

```typescript
class MyService {
  constructor(private getFooService: Promise<FooService> = injectAsync(FooService)) {}

  async someMethod() {
    const fooService: FooService = await this.getFooService;
    // ...
  }
}
```

## Synchronous constructor injection

Since Needle DI uses default parameters, and performs no static analysis (e.g. through reflection), it is not possible
to use `inject()` in constructor injection, **even when the class is constructed within an asynchronous `.getAsync()` process**.

This is because most providers are lazy, and those services will only be constructed on demand.

A possible workaround for this restriction is to construct your service eagerly and bind a static value instead:

```typescript
const fooService = await getFooService();

container.bind({
  provide: FooService,
  useValue: fooService,
});
```

By eagerly constructing the service and binding it as a static value, you can avoid the need to work with promises in your constructors.

> [!NOTE]
> We know this is suboptimal, and we do have plans to remove this constraint in a future version.
