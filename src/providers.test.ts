import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "./container.js";
import { InjectionToken } from "./tokens.js";
import { injectable } from "./decorators.js";

const myServiceConstructorSpy = vi.fn();

class MyService {
  constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("Providers", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("Constructor providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError("No provider(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind(MyService);

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);

    expect(() => container.bind(MyService)).toThrowError("existing provider was already constructed");
  });

  it("Class providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError("No provider(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind({
      provide: MyService,
      useClass: MyService,
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Value providers should be provided", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError("No provider(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    const myService = new MyService();

    container.bind({
      provide: MyService,
      useValue: myService,
    });

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Factory providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError("No provider(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind({
      provide: MyService,
      useFactory: () => new MyService(),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Async providers should be provided once", async () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError("No provider(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();
    expect(container.getAsync(MyService)).rejects.toThrowError("No provider(s) found");
    expect(await container.getAsync(MyService, { optional: true })).toBeUndefined();

    container.bind({
      provide: MyService,
      async: true,
      useFactory: () => Promise.resolve(new MyService()),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();
    expect(() => container.get(MyService)).toThrowError("use injectAsync() or container.getAsync() instead");

    const myService = await container.getAsync(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(await container.getAsync(MyService)).toBe(myService);
    expect(await container.getAsync(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Existing providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError("No provider(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    const OTHER_TOKEN = new InjectionToken<MyService>("MyService");

    container.bind(MyService);
    container.bind({
      provide: OTHER_TOKEN,
      useExisting: MyService,
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(OTHER_TOKEN);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(OTHER_TOKEN)).toBe(myService);
    expect(container.get(OTHER_TOKEN, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Token factories should be provided once", () => {
    const container = new Container();

    const TOKEN = new InjectionToken<MyService>("MyService", {
      factory: () => new MyService(),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(TOKEN);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(TOKEN)).toBe(myService);
    expect(container.get(TOKEN, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Token async factories should be provided once", async () => {
    const container = new Container();

    const TOKEN = new InjectionToken<MyService>("MyService", {
      async: true,
      factory: () => Promise.resolve(new MyService()),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = await container.getAsync(TOKEN);

    expect(myService).toBeInstanceOf(MyService);
    expect(await container.getAsync(TOKEN)).toBe(myService);
    expect(await container.getAsync(TOKEN, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  describe("abstract classes and inheritance", () => {
    it("should support annotated subclasses", () => {
      abstract class AbstractService {
        protected constructor(public name = "AbstractService") {}
      }

      @injectable()
      class FooService extends AbstractService {
        constructor(public fooProp = "foo") {
          super("FooService");
        }
      }

      const container = new Container();

      expect(container.get(AbstractService)).toBeInstanceOf(FooService);
      expect(container.get(FooService)).toBeInstanceOf(FooService);
      expect(container.get(FooService)).toBe(container.get(AbstractService));
      expect(container.get(FooService)).toBeInstanceOf(AbstractService);

      expect(container.get(AbstractService)).toBeInstanceOf(FooService);
    });

    it("should support binding subclasses", () => {
      abstract class AbstractService {
        protected constructor(public name = "AbstractService") {}
      }

      class FooService extends AbstractService {
        constructor(public fooProp = "foo") {
          super("FooService");
        }
      }

      class BarService extends AbstractService {
        constructor(public fooProp = "bar") {
          super("BarService");
        }
      }

      const container = new Container();

      container
        .bind({
          provide: FooService,
          useClass: FooService,
        })
        .bind({
          provide: BarService,
          useClass: BarService,
        })
        .bind({
          provide: AbstractService,
          useExisting: FooService,
        });

      expect(container.get(FooService)).toBeInstanceOf(FooService);
      expect(container.get(FooService)).toBeInstanceOf(AbstractService);
      expect(container.get(BarService)).toBeInstanceOf(BarService);
      expect(container.get(BarService)).toBeInstanceOf(AbstractService);

      expect(container.get(AbstractService)).toBeInstanceOf(FooService);
    });
  });

  describe("Multi-provider injection", () => {
    it("should support multi-value providers", () => {
      const container = new Container();

      const TOKEN = new InjectionToken<number>("TOKEN");
      const OTHER_TOKEN = new InjectionToken<number>("OTHER_TOKEN");

      container
        .bind({
          provide: TOKEN,
          multi: true,
          useValue: 1,
        })
        .bind({
          provide: TOKEN,
          multi: true,
          useValue: 2,
        });

      expect(container.get(TOKEN, { multi: true })).toEqual([1, 2]);
      expect(() => container.get(OTHER_TOKEN, { multi: true })).toThrowError("No provider(s) found");
      expect(container.get(OTHER_TOKEN, { multi: true, optional: true })).toBeUndefined();

      expect(() => {
        container.bind({
          provide: TOKEN,
          multi: true,
          useValue: 1,
        });
      }).toThrowError("already constructed");
    });

    it("should support multi-value async providers", async () => {
      const container = new Container();

      const TOKEN = new InjectionToken<number>("TOKEN");
      const OTHER_TOKEN = new InjectionToken<number>("OTHER_TOKEN");

      container
        .bind({
          provide: TOKEN,
          multi: true,
          async: true,
          useFactory: () => Promise.resolve(1),
        })
        .bind({
          provide: TOKEN,
          multi: true,
          async: true,
          useFactory: () => Promise.resolve(2),
        });

      expect(await container.getAsync(TOKEN, { multi: true })).toEqual([1, 2]);
      expect(container.getAsync(OTHER_TOKEN, { multi: true })).rejects.toThrowError("No provider(s) found");
      expect(await container.getAsync(OTHER_TOKEN, { multi: true, optional: true })).toBeUndefined();

      expect(() => {
        container.bind({
          provide: TOKEN,
          multi: true,
          async: true,
          useFactory: () => Promise.resolve(1),
        });
      }).toThrowError("already constructed");
    });
  });

  it("should throw an error when requesting a single async one", () => {
    const container = new Container();
    const MY_TOKEN = Symbol.for("my-token");

    container.bindAll(
      {
        provide: MY_TOKEN,
        useFactory: () => Promise.resolve(1),
        async: true,
        multi: true,
      },
      {
        provide: MY_TOKEN,
        useFactory: () => Promise.resolve(2),
        async: true,
        multi: true,
      },
    );

    expect(() => container.get(MY_TOKEN)).toThrowError("use injectAsync() or container.getAsync() instead");
  });
});
