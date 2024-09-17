import { bootstrap, Container, inject, injectable } from './index.js';
import { describe, expect, it } from 'vitest';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class FooService {
}

@injectable()
class BarService {
    constructor(
        private fooService: FooService = inject(FooService),
    ) {
    }
}

describe('Examples', () => {
    it('Bootstrap', () => {
        // to create the DI container:
        const container = new Container();
        const barService = container.get(BarService);

        expect(barService).toBeInstanceOf(BarService);
        expect(bootstrap(BarService)).toBeInstanceOf(BarService);
    });
});