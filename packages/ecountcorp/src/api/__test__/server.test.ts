import { mainApp } from '../mainApp';

describe('Server', () => {
    it('health check returns 200', async () => {
        expect((await mainApp.sendPost('GetSolutionList', {})).length).toBeGreaterThan(0);
    });

    it('message endpoint says hello', async () => {
        expect('Dfd').toEqual('Dfd');
    });
});
