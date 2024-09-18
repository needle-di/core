import { afterEach, describe, expect, it, vi } from "vitest";
import { injectable } from "./decorators.js";
import { Container } from "./container.js";
import { InjectionToken } from "./tokens.js";

const myServiceConstructorSpy = vi.fn();

@injectable()
class MyService {
  constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("Auto-binding", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("Annotated classes should bind automatically and be constructed once", () => {
    const container = new Container();

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();
    expect(() => container.get(MyService)).not.toThrowError();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Injection tokens with factories should bind automatically and be constructed once", async () => {
    const container = new Container();

    const MY_SERVICE = new InjectionToken<MyService>("MyService", {
      factory: () => new MyService(),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();
    expect(() => container.get(MY_SERVICE)).not.toThrowError();

    const myService = container.get(MY_SERVICE);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MY_SERVICE)).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });
});
