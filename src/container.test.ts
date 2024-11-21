import { afterEach, describe, expect, it, vi } from "vitest";
import { bootstrap, bootstrapAsync, Container, inject, injectAsync } from "./container.ts";
import { injectable } from "./decorators.ts";
import { InjectionToken } from "./tokens.ts";

const myServiceConstructorSpy = vi.fn();

@injectable()
class MyService {
  constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("Container API", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("inject", () => {
    expect(() => inject(MyService)).toThrowError("You can only invoke inject() from the injection context");

    const container = new Container();
    const token = new InjectionToken<MyService>("some-token");

    expect(() => container.get(token)).toThrowError("No provider(s) found");

    container.bind({
      provide: token,
      useFactory: () => inject(MyService),
    });

    expect(container.get(token)).toBeInstanceOf(MyService);
  });

  it("injectAsync", async () => {
    expect(injectAsync(MyService)).rejects.toThrowError("You can only invoke injectAsync() from the injection context");

    const container = new Container();
    const token = new InjectionToken<string>("some-token");
    const otherToken = new InjectionToken<string>("other-token");
    const aliasToken = new InjectionToken<string>("alias-token");

    container
      .bind({
        provide: otherToken,
        async: true,
        useFactory: () => Promise.resolve("foo"),
      })
      .bind({
        provide: token,
        async: true,
        useFactory: () => injectAsync(otherToken),
      })
      .bind({
        provide: aliasToken,
        useExisting: token,
      });

    expect(await container.getAsync(token)).toBe("foo");
    expect(await container.getAsync(aliasToken)).toBe("foo");
  });

  it("bootstrap", () => {
    expect(bootstrap(MyService)).toBeInstanceOf(MyService);
    expect(bootstrap(MyService)).toBeInstanceOf(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(2);
  });

  it("bootstrapAsync", async () => {
    expect(await bootstrapAsync(MyService)).toBeInstanceOf(MyService);
    expect(await bootstrapAsync(MyService)).toBeInstanceOf(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(2);
  });
});
