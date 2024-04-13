import { addSingleton, get } from '../src/node';

describe('node', () => {
    it('add and get check', () => {
        class TestClass {}
        const identifier = Symbol.for('Test');
        addSingleton(identifier, TestClass);
        const getObj = get(identifier);
        expect(getObj).toBeDefined();
    });
});
