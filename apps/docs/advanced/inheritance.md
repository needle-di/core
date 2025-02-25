
# Inheritance support

Needle DI offers extensive support for inheritance, allowing
for abstractions and interfaces.

## Auto-binding using `@injectable()`

> [!NOTE]
> Auto-binding with `@injectable()` has some limitations, see the note below.

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

> [!IMPORTANT]
> If you inject something using a parent class as token, make sure your subclasses are referenced somewhere. Otherwise, the auto-binding might not work since their
> decorators are not invoked. Even worse, your subclasses might not even appear in your final bundle due to 
> [tree-shaking](/advanced/tree-shaking).
> 
> To prevent this, consider to register your subclasses explicitly using [manual binding](#manual-binding):
> 
> ```typescript
> container.bindAll(FooService, BarService);
> ```

## Manual binding

If you bind something that has a parent class, a multi-provider for the parent class will be registered automatically.

Given the following example:

```typescript
abstract class ExampleService {
  /* ... */
}

class FooService extends ExampleService {
  /* ... */
}

class BarService extends ExampleService {
  /* ... */
}

container.bindAll(
  FooService,
  BarService,
);
```

The container will automatically register the following bindings internally:

```typescript
container.bindAll(
  {
    provide: ExampleService,
    useExisting: FooService,
    multi: true,
  },
  {
    provide: ExampleService,
    useExisting: BarService,
    multi: true,
  }
);
```

This enables you to inject all instances of `ExampleService` using multi-injection:
```typescript
const fooService = container.get(FooService);
const barService = container.get(BarService);

const myServices = container.get(ExampleService, { multi: true });
//    ^? Type will be inferred as `ExampleService[]`
//        and will be the same instances as "fooService" and "barService'
```

This even works with multiple levels of inheritance.

## What about interfaces?

If you're using TypeScript interfaces instead, you should use [injection tokens](/concepts/tokens#injectiontoken-t) instead. 
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
