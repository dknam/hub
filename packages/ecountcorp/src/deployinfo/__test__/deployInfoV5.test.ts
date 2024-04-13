import { Str } from '@ecdh/util';
import { DeployInfoHandlerV5 } from '..';

describe('deployInfo v5', () => {
    it('read test', async () => {
        const handler = new DeployInfoHandlerV5();
        const fileString = await handler.read({
            SERVER_IP: '10.10.9.101',
        });
        expect(Str.includes(fileString, 'EnableAPM')).toBeTruthy();
    });

    it('parse, toString Test', async () => {
        const handler = new DeployInfoHandlerV5();
        const fileString = await handler.read({
            SERVER_IP: '10.10.9.101',
        });
        const model1 = handler.parse(fileString);
        const toString1 = handler.toString(model1);
        const model2 = handler.parse(toString1);
        const toString2 = handler.toString(model2);
        expect(toString1).toEqual(toString2);
    });
});
