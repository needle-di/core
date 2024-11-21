import { describe, expect, it } from "vitest";
import { getInjectableTargets, injectable, type InjectableClass } from "./decorators.ts";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
abstract class AbstractService {}

@injectable()
class FooService extends AbstractService {}

@injectable()
class BarService extends AbstractService {}

@injectable()
class SpecialBarService extends BarService {}

class BazService extends AbstractService {}

@injectable()
class SpecialBazService extends BazService {}

describe("Decorators", () => {
  it("should register every annotated class across its hierarchy", () => {
    expect(getInjectableTargets(AbstractService as InjectableClass).map((it) => it.name)).toEqual([
      "FooService",
      "BarService",
      "SpecialBarService",
      "SpecialBazService",
    ]);

    expect(getInjectableTargets(FooService as InjectableClass).map((it) => it.name)).toEqual(["FooService"]);

    expect(getInjectableTargets(BarService as InjectableClass).map((it) => it.name)).toEqual([
      "BarService",
      "SpecialBarService",
    ]);

    expect(getInjectableTargets(SpecialBarService as InjectableClass).map((it) => it.name)).toEqual([
      "SpecialBarService",
    ]);

    expect(getInjectableTargets(BazService as InjectableClass).map((it) => it.name)).toEqual(["SpecialBazService"]);

    expect(getInjectableTargets(SpecialBazService as InjectableClass).map((it) => it.name)).toEqual([
      "SpecialBazService",
    ]);
  });
});
