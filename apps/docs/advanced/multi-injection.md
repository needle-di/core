
# Multi-injection

By default, when you bind an existing token again, it will overwrite any previous binding.

However, it is also possible to register multiple values for the same token:

```typescript
import { Container } from "@needle-di/core";

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

## Behaviour & limitations

There are some rules associated with multi-providers:

- It is not allowed to combine multiple providers for the same token with both `multi: false` and `multi: true`.
- When you specify only one provider with `multi: true`, it is still allowed to inject it as a single instance.
- When you specify multiple providers with `multi: true`, it will throw an error when you try to inject a single
  instance.
- When you try to inject with `multi: true` and `optional: true`, and there are no providers, it will still
  return `undefined` instead of an empty array.
