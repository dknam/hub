import { IPlatformModule } from '..';
import httpClient from './httpClient';

const browserModule: IPlatformModule = {
    httpClient: httpClient,
};

export default browserModule;
export * from './httpClient';
