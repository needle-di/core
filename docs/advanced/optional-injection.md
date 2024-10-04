
# Optional injection

By default, when you try to inject something that isn't provided, Needle DI will throw an error.

Alternatively, you can use optional injection, by passing `{ optional: true }`. Instead of throwing an error, it will
now return the requested service, or `undefined` if not found:

```typescript
import { inject } from "@needle-di/core";

class MyService {
  constructor(
    private fooService = inject(FooService),
    //      ^? Type will be inferred as `FooService`
    private barService = inject(BarService, { optional: true }),
    //      ^? Type will be inferred as `BarService | undefined`
  ) {}
}
```

## Outside the injection context

When you construct an instance of `MyService` manually outside the injection context, and you don't pass any argument
for an optional dependency, the `inject()` function will not throw an error, but gracefully return `undefined` instead:

```typescript
class MyService {
    constructor(
        private barService = inject(BarService, { optional: true }),
    ) {}
}
const myService = new MyService(); // will cause no issues
```
