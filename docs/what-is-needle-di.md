---
outline: deep
---

# What is Needle DI?

Needle DI is a small, lightweight JavaScript library for dependency injection.

## Why dependency injection?

Dependency Injection (DI) is a design pattern in (object-oriented) programming where an object's or function's
dependencies are provided to it externally rather than the object creating them itself. In
simpler terms, instead of an object creating its own resources, they are "injected" into the object, usually through its
constructor.

Using dependency injection will lead to:

* **Loose coupling**: By injecting dependencies, classes depend on abstractions (like interfaces) instead of specific
  implementations. This makes code more flexible and easier to maintain or extend.

* **Easier testing**: Since dependencies can be injected, you can easily swap real dependencies with mock or fake
  objects when
  unit testing, allowing for isolated testing.

* **Better code organization**: DI promotes separation of concerns, meaning each class has a specific role and does not
  have
  to manage its own dependencies, leading to cleaner and more organized code.

* **Reusability**: When dependencies are provided externally, classes become more modular and can be reused in different
  contexts with different dependencies.

* **Improved maintainability**: As your codebase grows, the ability to swap dependencies without needing to change core
  logic
  becomes critical. DI allows you to update, change, or replace dependencies with minimal impact.

In essence, DI helps in managing the complexity of large systems, improves code quality, and makes it easier to adapt to
changing requirements.

## Design principles

### Lightweight

Needle DI is specifically designed for apps with a small footprint (e.g. serverless functions like AWS lambdas),
by minimizing bundle size by enabling tree-shaking and by not depending on any reflection metadata.

### Type-safe

Needle DI is written in TypeScript. You don't have to use TypeScript to use Needle DI, but when you do,
all type definitions are included and will make sure your code is consistent.

### Modern

Needle DI is an ESM-only package. This makes it suitable for modern Node.js and web projects. It also
uses stage 3 decorators, to push for ECMAScript standards.

## When to use Needle DI?

In most application frameworks for web or Node.js (e.g. [Angular](https://angular.dev/guide/di), [NestJS](https://docs.nestjs.com/providers#dependency-injection)), a dependency injection solution is
already included. Therefore, Needle DI is mainly intended for smaller "vanilla" JavaScript/TypeScript projects.

In fact, Needle DI was originally created for TypeScript AWS Lambda functions, but you can also use this for small web projects.
