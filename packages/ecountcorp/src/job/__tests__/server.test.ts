import { job } from '../..';

describe('Server', () => {
    it('health check returns 200', async () => {
        expect(job.getJobList()).toEqual('test');
    });

    it('message endpoint says hello', async () => {
        expect('Dfd').toEqual('Dfd');
    });
});
