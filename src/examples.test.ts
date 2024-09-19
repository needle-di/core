import { injectable } from "./decorators.js";
import { Container, inject, injectAsync } from "./container.js";
import { describe, expect, it, vitest } from "vitest";
import { InjectionToken } from "./tokens.js";

@injectable()
class OtherService {
  getMessage(): string {
    return "test";
  }
}

@injectable()
class MyService {
  private readonly otherService2 = inject(OtherService);

  constructor(private readonly otherService = inject(OtherService)) {}

  sayHello(): string {
    return `Constructor injection ${this.otherService.getMessage()}`;
  }

  sayHello2(): string {
    return `Initializer injection ${this.otherService2.getMessage()}`;
  }

  triggerInject(): void {
    inject(OtherService);
  }
}

interface Foo {
  foo: string;
}

interface Bar {
  bar: string;
}

const fooToken1 = new InjectionToken<Foo>("foo-token1");
const fooToken2 = new InjectionToken<Foo>("foo-token2");
const fooToken3 = new InjectionToken<Foo>("foo-token3");

const tokenProvidedAsync = new InjectionToken<Foo>("provided-async");
const tokenWithoutProvider = new InjectionToken<Foo>("not-provided");

const barToken = new InjectionToken<Bar>("bar", {
  factory: () => ({
    bar: "bar1",
  }),
});

@injectable()
class ProviderService {
  constructor(
    public providedByValue = inject<Foo>("by-value-with-token-as-string"),
    public providedByFactory = inject(fooToken1),
    public providedByFactoryTwice = inject(fooToken1),
    public providedByFactoryWithInject = inject(fooToken2),
    public providedByExisting = inject(fooToken3),
    public providedAsync = injectAsync(tokenProvidedAsync),
    public notProvided = inject(tokenWithoutProvider, { optional: true }),
  ) {}
}

describe("Container", () => {
  it("should bind classes", () => {
    const container = new Container();

    container
      .bind({
        provide: MyService,
        useClass: MyService,
      })
      .bind({
        provide: OtherService,
        useClass: OtherService,
      });

    const service = container.get(MyService);

    expect(service.sayHello()).toBe("Constructor injection test");
  });

  it("should auto-bind classes", () => {
    const container = new Container();
    const service = container.get(MyService);

    expect(service.sayHello()).toBe("Constructor injection test");
  });

  it("should allow initializer injection", () => {
    const container = new Container();
    const service = container.get(MyService);

    expect(service.sayHello2()).toBe("Initializer injection test");
  });

  it("should not allow injection outside injection context", () => {
    const container = new Container();
    const service = container.get(MyService);

    expect(() => service.triggerInject()).toThrowError();
  });

  it("should support all kinds of providers", async () => {
    const container = new Container();
    const factoryFn = vitest.fn(() => ({
      foo: "foo2",
    }));
    container
      .bind({
        provide: "by-value-with-token-as-string",
        useValue: {
          foo: "foo1",
        },
      })
      .bind({
        provide: fooToken1,
        useFactory: factoryFn,
      })
      .bind({
        provide: fooToken2,
        useFactory: () => ({
          foo: inject(barToken).bar,
        }),
      })
      .bind({
        provide: fooToken3,
        useExisting: fooToken1,
      })
      .bind({
        provide: tokenProvidedAsync,
        async: true,
        useFactory: () => Promise.resolve({ foo: "async" }),
      });

    expect(factoryFn).not.toHaveBeenCalled();

    const service = container.get(ProviderService);

    expect(service.providedByValue.foo).toBe("foo1");
    expect(service.providedByFactory.foo).toBe("foo2");
    expect(service.providedByFactoryTwice.foo).toBe("foo2");
    expect(service.providedByFactoryWithInject.foo).toBe("bar1");
    expect(service.providedByExisting.foo).toBe("foo2");
    expect(service.providedAsync).toBeInstanceOf(Promise);
    expect(service.notProvided).toBeUndefined();

    expect(factoryFn).toHaveBeenCalledTimes(1);

    expect(() => container.get(tokenWithoutProvider)).toThrowError();
    expect(() =>
      container.get(tokenWithoutProvider, { optional: false }),
    ).toThrowError();

    expect(() => container.get(tokenProvidedAsync)).toThrowError();

    const fooAsync = await container.getAsync(tokenProvidedAsync);
    expect(fooAsync).toEqual({ foo: "async" });
  });
});
