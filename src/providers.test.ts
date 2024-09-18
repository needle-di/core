import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "./container.js";
import { InjectionToken } from "./tokens.js";
import { injectable } from './decorators.js';

const myServiceConstructorSpy = vi.fn();

class MyService {
  constructor(public name = 'MyService') {
    myServiceConstructorSpy();
  }
}

describe("Providers", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("Constructor providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError();
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind(MyService);

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Class providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError();
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

    expect(() => container.get(MyService)).toThrowError();
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

    expect(() => container.get(MyService)).toThrowError();
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

    expect(() => container.get(MyService)).toThrowError();
    expect(container.get(MyService, { optional: true })).toBeUndefined();
    expect(container.getAsync(MyService)).rejects.toThrowError();
    expect(await container.getAsync(MyService, { optional: true })).toBeUndefined();

    container.bind({
      provide: MyService,
      async: true,
      useFactory: () => new Promise<MyService>(resolve => resolve(new MyService()))
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();
    expect(() => container.get(MyService)).toThrowError();

    const myService = await container.getAsync(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(await container.getAsync(MyService)).toBe(myService);
    expect(await container.getAsync(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Existing providers should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrowError();
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    const OTHER_TOKEN = new InjectionToken<MyService>('MyService');

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

  describe('abstract classes and inheritance', () => {
    abstract class AbstractService {
      protected constructor(public name = 'AbstractService') {}
    }

    it('should support annotated subclasses', () => {
      @injectable()
      class FooService extends AbstractService {
        constructor(public fooProp = 'foo') {
          super('FooService')
        }
      }

      const container = new Container();

      expect(container.get(FooService)).toBeInstanceOf(FooService);
      expect(container.get(FooService)).toBeInstanceOf(AbstractService);

      expect(container.get(AbstractService)).toBeInstanceOf(FooService);
    });

    it('should support binding subclasses', () => {
      class FooService extends AbstractService {
        constructor(public fooProp = 'foo') {
          super('FooService')
        }
      }

      class BarService extends AbstractService {
        constructor(public fooProp = 'bar') {
          super('BarService')
        }
      }

      const container = new Container();

      container
          .bind({
            provide: FooService,
            useClass: FooService
          })
          .bind({
            provide: BarService,
            useClass: BarService
          })
          .bind({
            provide: AbstractService,
            useExisting: FooService
          })

      expect(container.get(FooService)).toBeInstanceOf(FooService);
      expect(container.get(FooService)).toBeInstanceOf(AbstractService);
      expect(container.get(BarService)).toBeInstanceOf(BarService);
      expect(container.get(BarService)).toBeInstanceOf(AbstractService);

      expect(container.get(AbstractService)).toBeInstanceOf(FooService);
    });


  });
});