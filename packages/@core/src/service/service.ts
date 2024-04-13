import { ECountApplicationContext } from '../application';
export const IECountService = 'IECountService';
export interface IECountService<TPlatformBasedContext = any> {
    applicationContext: ECountApplicationContext<TPlatformBasedContext>;
    startUp(): Promise<void>;
}

export abstract class ECountService<TPlatformBasedContext = any> implements IECountService<TPlatformBasedContext> {
    applicationContext!: ECountApplicationContext<TPlatformBasedContext>;
    abstract startUp(): Promise<void>;
    private async _startUp(applicationContext: ECountApplicationContext<TPlatformBasedContext>): Promise<void> {
        this.applicationContext = applicationContext;
        await this.startUp();
    }
}
