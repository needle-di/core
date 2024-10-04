
# Containers

## Creating a container

The dependency injection (DI) container will keep track of all bindings and hold the actual instances of your services. To
create it, simply construct one:

```typescript
import { Container } from "@needle-di/core";

const container = new Container();
```

Every DI container keeps track of its own service instances separately.

## Binding services

You can bind services using the `.bind()` or `.bindAll()` methods:

```typescript
container
    .bind(FooService)
    .bind({
        provide: BarService,
        useFactory: () => new BarService(),
    });

container.bindAll(
    {
        provide: Logger,
        useFactory: () => new FileLogger(),
    },
    {
        provide: AppConfig,
        useValue: someConfig,
    },
);
```

Learn more about the different types of [providers](./providers) you can use for binding.

## Constructing & retrieving services

To obtain something from the container, you can use `container.get(token)`:

```typescript
const fooService = container.get(FooService);
//    ^? Type will be inferred as `FooService`
```

This will create a new `FooService`, or return the existing one if it was requested before.

> [!NOTE]
> To inject dependencies into classes, use [constructor injection](./injection#constructor-injection) instead.

## Bootstrap

If you don't need to interact with the DI container at all, you can also use the `bootstrap()` shorthand function
instead. This will internally create a new container and return the requested service directly:

```typescript
import { bootstrap } from "@needle-di/core";

const barService = bootstrap(BarService);
```

This is useful if you solely depend on [auto-binding](/concepts/binding#auto-binding) and/or [tree-shakeable injection tokens](/advanced/tree-shaking)
and therefore don't need to register anything manually into your container.
