# Changelog

## [0.8.2](https://github.com/needle-di/core/compare/core-v0.8.1...core-v0.8.2) (2024-10-05)


### Features

* allow synchronous constructor injection of async providers ([#20](https://github.com/needle-di/core/issues/20)) ([6cf3ec3](https://github.com/needle-di/core/commit/6cf3ec3eabd88f541d6714b56ca0b70ab5e779a2))
* auto-register parent classes for manual bindings as well ([#26](https://github.com/needle-di/core/issues/26)) ([d3d909f](https://github.com/needle-di/core/commit/d3d909fc603c74d4c81968d64545091b6bd7e437))
* inheritance support / added more tests ([#1](https://github.com/needle-di/core/issues/1)) ([13f626c](https://github.com/needle-di/core/commit/13f626ce3985f447e11f371ff476f5da2907f067))
* **providers:** add support for multi-providers ([#8](https://github.com/needle-di/core/issues/8)) ([b563a1c](https://github.com/needle-di/core/commit/b563a1c1fbc9d9e3adb487459d611655ad0c6a15))
* **providers:** flatten multi-providers when using useExisting ([#10](https://github.com/needle-di/core/issues/10)) ([48df581](https://github.com/needle-di/core/commit/48df581ec4901ecdd642cc7c64e527de71d1ec48))
* support async token factories ([#5](https://github.com/needle-di/core/issues/5)) ([f39d6cd](https://github.com/needle-di/core/commit/f39d6cd28d6fdb96664f82f084d9ed55405ece4b))


### Bug Fixes

* add @release-it/bumper as dependency to fix bumping issues ([#31](https://github.com/needle-di/core/issues/31)) ([0acc865](https://github.com/needle-di/core/commit/0acc865784d5137a242e728593ed4738f1a77955))
* export injectAsync and AsyncFactoryProvider ([02d5fb0](https://github.com/needle-di/core/commit/02d5fb07f6dd2b8bfa157cc438f8f3d9625c1630))
* fix incorrect type-inference on bindAll() method ([#22](https://github.com/needle-di/core/issues/22)) ([7a2e3bd](https://github.com/needle-di/core/commit/7a2e3bdf2b22d194cefb0dcd3d4b2ddb9589516b))
* fix JSR bumping issues by adopting Release Please config ([#33](https://github.com/needle-di/core/issues/33)) ([977fc94](https://github.com/needle-di/core/commit/977fc9457e91b1f2640e6e217973ad9684c82dc7))
* **inheritance:** trigger auto-binding when using parent class as token ([#7](https://github.com/needle-di/core/issues/7)) ([0edbec7](https://github.com/needle-di/core/commit/0edbec733800c1919d0577e2bfcfa66d9bc14fb9))


### Documentation

* add Vitepress site with Github Pages ([#18](https://github.com/needle-di/core/issues/18)) ([245efbe](https://github.com/needle-di/core/commit/245efbe4def6a1c0647cfc6c06c299968ad0eec9))
* fix incorrect Github links ([60783f3](https://github.com/needle-di/core/commit/60783f3f4800ca64c676c31bfebbf93c20a2123b))
* improved docs and added JSDocs ([#24](https://github.com/needle-di/core/issues/24)) ([7084676](https://github.com/needle-di/core/commit/708467639a60603b63cb7405ecaeaadaf2979562))


### Miscellaneous Chores

* add release-please bootstrap file ([bc6ee60](https://github.com/needle-di/core/commit/bc6ee6002697ba9c0255f3f800db9747456c927e))
* fix changelog generation ([d617be5](https://github.com/needle-di/core/commit/d617be56ea86908d3d7d6ef257a0def182aba54b))
* migrate package to @needle-di/core + JavaScript Registry (JSR) adoption ([a3f523a](https://github.com/needle-di/core/commit/a3f523a05971343fd15faccdc012eec8e1e0f9c8))
* move NPM package to 'needle-di' ([7348441](https://github.com/needle-di/core/commit/7348441931179971dd41ac6583876faee3cfd241))
* release 0.0.3 ([1f8768f](https://github.com/needle-di/core/commit/1f8768faceceab651175433d20c853a03c404a3d))
