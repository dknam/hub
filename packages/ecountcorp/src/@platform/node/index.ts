import { IPlatformModule } from '..';
import httpClient from './httpClient';

const nodeModule: IPlatformModule = {
    httpClient: httpClient,
};

export default nodeModule;
