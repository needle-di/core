
# Inheritance support

Needle DI offers extensive support for inheritance, allowing
for abstractions and interfaces.

## Example

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

## Manual binding

Under the hood, the example above would be the same as:

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

This even works with multiple levels of inheritance.

## What about interfaces?

If you're using TypeScript interfaces instead, you should use injection tokens instead. 
This is because TypeScript interfaces don't exist at runtime and therefore cannot be used as tokens.

```typescript
interface Logger {
  info(): void;
}

class FileLogger implements Logger {
  info(): void {
    //
  }
}

class ConsoleLogger implements Logger {
  info(): void {
    //
  }
}

const LOGGER = new InjectionToken<Logger>('LOGGER');

container.bindAll(
  {
    provide: LOGGER,
    multi: true,
    useClass: FileLogger,
  },
  {
    provide: LOGGER,
    multi: true,
    useClass: ConsoleLogger,
  },
);
```
