# Needle DI 💉

> A light-weight type-safe Dependency Injection library for JavaScript and TypeScript projects

[![NPM version](http://img.shields.io/npm/v/@dirkluijk/needle-di.svg?style=flat-square)](https://www.npmjs.com/package/@dirkluijk/needle-di)
[![NPM downloads](http://img.shields.io/npm/dm/@dirkluijk/needle-di.svg?style=flat-square)](https://www.npmjs.com/package/@dirkluijk/needle-di)
[![Build status](https://github.com/dirkluijk/needle-di/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/dirkluijk/needle-di/actions/workflows/main.yml)

A light-weight TypeScript-first library for dependency injection.

* Stand-alone, no need to install other dependencies
* Intended for both JavaScript and TypeScript projects
* Supports three-shakeable injection tokens
* Inspired by [Angular](https://angular.dev/) and [InversifyJS](https://github.com/inversify/InversifyJS)
* Uses native [ECMAScript TC39 decorators](https://github.com/tc39/proposal-decorators) (currently stage 3)
* No need for `experimentalDecorators` and `emitDecoratorMetadata`
* No need for `reflect-metadata` or other reflection libraries

## Example usage

A simple example using constructor injection:

```typescript
import { injectable, inject } from '@dirkluijk/needle-di';

@injectable()
class FooService {}

@injectable()
class BarService {
    constructor(
        private fooService = inject(FooService)
    ) {}
}
```

By using the `@injectable` decorator, there is no need to register your services. Just create a new dependency injection container and request something by its token: 
```typescript
import { Container } from '@dirkluijk/needle-di';

const container = new Container();
const barService = container.get(BarService);
```

Or just:
```typescript
import { bootstrap } from '@dirkluijk/needle-di';

const barService = bootstrap(BarService);
```

Check out the [advanced examples](#advanced-examples) below to learn more!

## Features

* Constructor injection
* Three-shakable injection tokens
* Auto-binding using decorators
* Supports many kinds of tokens:
  * Any class reference
  * Any `string` or `symbol`
  * Any instance of `InjectionToken<T>` (for full type-safety)
* Supports many different providers:
  * Class references
  * Static values
  * Dynamic factories
  * Async factories
  * Multi providers
* Inheritance support

## Limitations

If you rely on many advanced features, this library could be too limited. In that case, we recommend [InversifyJS](https://github.com/inversify/InversifyJS) instead. 
However, if you prefer a light-weight library that works out of the box and provides full type-safety, please give it a shot! 

## Roadmap

* Extend the Container API
* Scoping
* ...

Please file an issue if you like to propose new features.

## Installation

```
npm install @dirkluijk/needle-di
```

## Advanced examples


