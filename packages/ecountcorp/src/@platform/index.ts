import { isBrowser } from './util';
import { IPlatformModule } from './interfaces';

export * from './interfaces';

const platformModuleLoader = new Promise<IPlatformModule>(async ($export) => {
    let modules: IPlatformModule | PromiseLike<IPlatformModule>;
    if (isBrowser()) {
        modules = (await import('./browser')).default;
    } else {
        modules = (await import('./node')).default;
    }
    $export(modules);
});

export default platformModuleLoader;
