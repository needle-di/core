import { injectable } from "./decorators.js";
import { bootstrap, Container, inject, injectAsync } from "./container.js";
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

    expect(() => service.triggerInject()).toThrowError("You can only invoke inject() from the injection context");
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

    expect(() => container.get(tokenWithoutProvider)).toThrowError("No provider(s) found");
    expect(() => container.get(tokenWithoutProvider, { optional: false })).toThrowError("No provider(s) found");

    expect(() => container.get(tokenProvidedAsync)).toThrowError("use injectAsync() or container.getAsync() instead");

    await container.getAsync(tokenProvidedAsync);

    expect(() => container.get(tokenProvidedAsync)).not.toThrowError();

    const fooAsync = await container.getAsync(tokenProvidedAsync);
    expect(fooAsync).toEqual({ foo: "async" });
  });

  it("should support multi-providers (example without auto-binding)", () => {
    abstract class AbstractService {
      protected constructor(private name: string) {}
    }

    class FooService extends AbstractService {
      constructor() {
        super("Foo");
      }
    }

    class BarService extends AbstractService {
      constructor() {
        super("Bar");
      }
    }

    const container = new Container();

    container
      .bind({
        provide: AbstractService,
        multi: true,
        useClass: FooService,
      })
      .bind({
        provide: AbstractService,
        multi: true,
        useClass: BarService,
      });

    const services = container.get(AbstractService, { multi: true });

    expect(services).not.toBeUndefined();
    expect(services).toHaveLength(2);

    const [serviceA, serviceB] = services;

    expect(serviceA).toBeInstanceOf(FooService);
    expect(serviceB).toBeInstanceOf(BarService);
  });

  it("should support multi-providers (example with auto-binding)", () => {
    abstract class AbstractService {
      protected constructor(private name: string) {}
    }

    @injectable()
    class FooService extends AbstractService {
      constructor() {
        super("Foo");
      }
    }

    @injectable()
    class BarService extends AbstractService {
      constructor() {
        super("Bar");
      }
    }

    const container = new Container();

    const services = container.get(AbstractService, { multi: true });

    expect(services).not.toBeUndefined();
    expect(services).toHaveLength(2);

    const [serviceA, serviceB] = services;

    expect(serviceA).toBeInstanceOf(FooService);
    expect(serviceB).toBeInstanceOf(BarService);
  });

  describe("should support multi-providers with multi-inheritance (example without auto-binding)", () => {
    abstract class AbstractService {
      protected constructor(private name: string) {}
    }

    class FooService extends AbstractService {
      constructor() {
        super("Foo");
      }
    }

    class BarService extends AbstractService {
      constructor() {
        super("Bar");
      }
    }

    class SpecialBarService extends BarService {
      constructor(public age = 6) {
        super();
      }
    }

    class BazService extends AbstractService {
      constructor() {
        super("Bar");
      }
    }

    class SpecialBazService extends BazService {
      constructor(public age = 8) {
        super();
      }
    }

    it("first parent class, then child class ", () => {
      const container = new Container();

      container.bindAll(
        {
          provide: AbstractService,
          useExisting: FooService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BarService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BazService,
          multi: true,
        },
        // todo: eliminate this one from auto-binding
        // {
        //   provide: AbstractService,
        //   useExisting: SpecialBarService,
        //   multi: true
        // },
        // todo: eliminate this one from auto-binding
        // {
        //   provide: AbstractService,
        //   useExisting: SpecialBazService,
        //   multi: true
        // },
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
          provide: BarService,
          useExisting: SpecialBarService,
          multi: true,
        },
        {
          provide: SpecialBarService,
          useClass: SpecialBarService,
          multi: true,
        },
        {
          provide: BazService,
          useClass: SpecialBazService,
          multi: true,
        },
        {
          provide: SpecialBazService,
          useClass: SpecialBazService,
          multi: true,
        },
      );

      const abstractServices = container.get(AbstractService, { multi: true });

      expect(abstractServices).not.toBeUndefined();
      expect(abstractServices).toHaveLength(4);

      const [abstractServiceFoo, abstractServiceBar, abstractServiceSpecialBar, abstractServiceSpecialBaz] =
        abstractServices;

      expect(abstractServiceFoo).toBeInstanceOf(FooService);
      expect(abstractServiceBar).toBeInstanceOf(BarService);
      expect(abstractServiceSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(abstractServiceSpecialBaz).toBeInstanceOf(SpecialBazService);

      const barServices = container.get(BarService, { multi: true });

      expect(barServices).not.toBeUndefined();
      expect(barServices).toHaveLength(2);

      const [barServicesBar, barServicesSpecialBar] = barServices;

      expect(barServicesBar).toBeInstanceOf(BarService);
      expect(barServicesBar).toBe(abstractServiceBar);
      expect(barServicesSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(barServicesSpecialBar).toBe(abstractServiceSpecialBar);

      const bazServices = container.get(BazService, { multi: true });

      expect(bazServices).not.toBeUndefined();
      expect(bazServices).toHaveLength(1);

      const [barServiceSpecialBaz] = bazServices;

      expect(barServiceSpecialBaz).toBeInstanceOf(SpecialBazService);
      expect(barServiceSpecialBaz).toBe(abstractServiceSpecialBaz);
    });

    it("first child class, then parent class ", () => {
      const container = new Container();

      container.bindAll(
        {
          provide: AbstractService,
          useExisting: FooService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BarService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BazService,
          multi: true,
        },
        // todo: eliminate this one from auto-binding
        // {
        //   provide: AbstractService,
        //   useExisting: SpecialBarService,
        //   multi: true
        // },
        // todo: eliminate this one from auto-binding
        // {
        //   provide: AbstractService,
        //   useExisting: SpecialBazService,
        //   multi: true
        // },
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
          provide: BarService,
          useExisting: SpecialBarService,
          multi: true,
        },
        {
          provide: SpecialBarService,
          useClass: SpecialBarService,
          multi: true,
        },
        {
          provide: BazService,
          useClass: SpecialBazService,
          multi: true,
        },
        {
          provide: SpecialBazService,
          useClass: SpecialBazService,
          multi: true,
        },
      );

      const bazServices = container.get(BazService, { multi: true });

      expect(bazServices).not.toBeUndefined();
      expect(bazServices).toHaveLength(1);

      const [barServiceSpecialBaz] = bazServices;

      expect(barServiceSpecialBaz).toBeInstanceOf(SpecialBazService);

      const barServices = container.get(BarService, { multi: true });

      expect(barServices).not.toBeUndefined();
      expect(barServices).toHaveLength(2);

      const [barServicesBar, barServicesSpecialBar] = barServices;

      expect(barServicesBar).toBeInstanceOf(BarService);
      expect(barServicesSpecialBar).toBeInstanceOf(SpecialBarService);

      const abstractServices = container.get(AbstractService, { multi: true });

      expect(abstractServices).not.toBeUndefined();
      expect(abstractServices).toHaveLength(4);

      const [abstractServiceFoo, abstractServiceBar, abstractServiceSpecialBar, abstractServiceSpecialBaz] =
        abstractServices;

      expect(abstractServiceFoo).toBeInstanceOf(FooService);
      expect(abstractServiceBar).toBeInstanceOf(BarService);
      expect(abstractServiceBar).toBe(barServicesBar);
      expect(abstractServiceSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(abstractServiceSpecialBar).toBe(barServicesSpecialBar);
      expect(abstractServiceSpecialBaz).toBeInstanceOf(SpecialBazService);
      expect(abstractServiceSpecialBaz).toBe(barServiceSpecialBaz);
    });
  });

  describe("should support multi-providers with multi-inheritance (example with auto-binding)", () => {
    abstract class AbstractService {
      protected constructor(private name: string) {}
    }

    @injectable()
    class FooService extends AbstractService {
      constructor() {
        super("Foo");
      }
    }

    @injectable()
    class BarService extends AbstractService {
      constructor() {
        super("Bar");
      }
    }

    @injectable()
    class SpecialBarService extends BarService {
      constructor(public age = 6) {
        super();
      }
    }

    class BazService extends AbstractService {
      constructor() {
        super("Bar");
      }
    }

    @injectable()
    class SpecialBazService extends BazService {
      constructor(public age = 8) {
        super();
      }
    }

    it("first parent class, then child class ", () => {
      const container = new Container();

      const abstractServices = container.get(AbstractService, { multi: true });

      expect(abstractServices).not.toBeUndefined();
      expect(abstractServices).toHaveLength(4);

      const [abstractServiceFoo, abstractServiceBar, abstractServiceSpecialBar, abstractServiceSpecialBaz] =
        abstractServices;

      expect(abstractServiceFoo).toBeInstanceOf(FooService);
      expect(abstractServiceBar).toBeInstanceOf(BarService);
      expect(abstractServiceSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(abstractServiceSpecialBaz).toBeInstanceOf(SpecialBazService);

      const barServices = container.get(BarService, { multi: true });

      expect(barServices).not.toBeUndefined();
      expect(barServices).toHaveLength(2);

      const [barServicesBar, barServicesSpecialBar] = barServices;

      expect(barServicesBar).toBeInstanceOf(BarService);
      expect(barServicesBar).toBe(abstractServiceBar);
      expect(barServicesSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(barServicesSpecialBar).toBe(abstractServiceSpecialBar);

      const bazServices = container.get(BazService, { multi: true });

      expect(bazServices).not.toBeUndefined();
      expect(bazServices).toHaveLength(1);

      const [barServiceSpecialBaz] = bazServices;

      expect(barServiceSpecialBaz).toBeInstanceOf(SpecialBazService);
      expect(barServiceSpecialBaz).toBe(abstractServiceSpecialBaz);
    });

    it("first child class, then parent class ", () => {
      const container = new Container();

      const bazServices = container.get(BazService, { multi: true });

      expect(bazServices).not.toBeUndefined();
      expect(bazServices).toHaveLength(1);

      const [barServiceSpecialBaz] = bazServices;

      expect(barServiceSpecialBaz).toBeInstanceOf(SpecialBazService);

      const barServices = container.get(BarService, { multi: true });

      expect(barServices).not.toBeUndefined();
      expect(barServices).toHaveLength(2);

      const [barServicesBar, barServicesSpecialBar] = barServices;

      expect(barServicesBar).toBeInstanceOf(BarService);
      expect(barServicesSpecialBar).toBeInstanceOf(SpecialBarService);

      const abstractServices = container.get(AbstractService, { multi: true });

      expect(abstractServices).not.toBeUndefined();
      expect(abstractServices).toHaveLength(4);

      const [abstractServiceFoo, abstractServiceBar, abstractServiceSpecialBar, abstractServiceSpecialBaz] =
        abstractServices;

      expect(abstractServiceFoo).toBeInstanceOf(FooService);
      expect(abstractServiceBar).toBeInstanceOf(BarService);
      expect(abstractServiceBar).toBe(barServicesBar);
      expect(abstractServiceSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(abstractServiceSpecialBar).toBe(barServicesSpecialBar);
      expect(abstractServiceSpecialBaz).toBeInstanceOf(SpecialBazService);
      expect(abstractServiceSpecialBaz).toBe(barServiceSpecialBaz);
    });
  });

  it("should support flattening multi-providers (combination of multi and use-existing)", () => {
    const container = new Container();

    container.bindAll(
      {
        provide: "myNumbers",
        useValue: 1,
        multi: true,
      },
      {
        provide: "myNumbers",
        useValue: 2,
        multi: true,
      },
      {
        provide: "otherNumber",
        useValue: 3,
      },
      {
        provide: "anotherNumber",
        useValue: 4,
      },
      {
        provide: "otherNumbers",
        useValue: 5,
        multi: true,
      },
      {
        provide: "a",
        useExisting: "myNumbers",
      },
      {
        provide: "b",
        useExisting: "myNumbers",
        multi: true,
      },
      {
        provide: "b",
        useExisting: "otherNumber",
        multi: true,
      },
      {
        provide: "c",
        useExisting: "anotherNumber",
        multi: true,
      },
      {
        provide: "d",
        useExisting: "myNumbers",
        multi: true,
      },
      {
        provide: "d",
        useExisting: "otherNumbers",
        multi: true,
      },
      {
        provide: "d",
        useExisting: "otherNumber",
        multi: true,
      },
      {
        provide: "e",
        useExisting: "otherNumber",
        multi: true,
      },
      {
        provide: "f",
        useExisting: "otherNumbers",
        multi: true,
      },
    );

    // my numbers
    expect(() => container.get("myNumbers")).toThrowError("multiple values were provided");
    expect(container.get("myNumbers", { multi: true })).toEqual([1, 2]);

    // a
    expect(() => container.get("a")).toThrowError("multiple values were provided");
    expect(container.get("a", { multi: true })).toEqual([1, 2]);

    // b
    expect(() => container.get("b")).toThrowError("multiple values were provided");
    expect(container.get("b", { multi: true })).toEqual([1, 2, 3]);

    // c
    expect(container.get("c")).toEqual(4);
    expect(container.get("c", { multi: true })).toEqual([4]);

    // d
    expect(() => container.get("d")).toThrowError("multiple values were provided");
    expect(container.get("d", { multi: true })).toEqual([1, 2, 5, 3]);

    // e
    expect(container.get("e")).toEqual(3);
    expect(container.get("e", { multi: true })).toEqual([3]);

    // f
    expect(container.get("f")).toEqual(5);
    expect(container.get("f", { multi: true })).toEqual([5]);
  });

  it("should support initialization injection", () => {
    @injectable()
    class Foo {
      public sayHi() {
        return "Hi!";
      }
    }

    @injectable()
    class Bar {
      private foo = inject(Foo);

      public letFooSayHi() {
        return this.foo.sayHi();
      }
    }

    const bar = bootstrap(Bar);
    expect(bar.letFooSayHi()).toBe("Hi!");
  });
});
