import { IECountService } from '../service';

type ServiceIdentifier = string;

// 각 플랫폼 별로 implements 한다
export interface ECountApplicationContext<TPlatformBasedContext> {
    executionContext: TPlatformBasedContext;
    registerContributor(): void;
    registerService(serviceIdentifier: ServiceIdentifier, service: IECountService, singleton?: boolean): IECountService;
    getService<TService extends IECountService>(serviceIdentifier: ServiceIdentifier): TService | undefined;
    getEventHandlers(): IterableIterator<[string, any]>;
    on(lifecycle: any): void;
    initializeEventHandlerAsync(): Promise<void>;
    startUp(): Promise<void>;
}

export class ECountApplicationContext<TPlatformBasedContext>
    implements ECountApplicationContext<TPlatformBasedContext>
{
    executionContext!: TPlatformBasedContext;

    private services = new Map<ServiceIdentifier, IECountService>();
    private event_handlers = new Map<string, any>();

    registerContributor(): void {}

    registerEventHandler(): void {}

    registerService(
        serviceIdentifier: ServiceIdentifier,
        service: IECountService,
        singleton?: boolean
    ): IECountService {
        this.services.set(serviceIdentifier, service);
        return service;
    }

    getService<TService extends IECountService<any>>(serviceIdentifier: ServiceIdentifier): TService | undefined {
        return this.services.get(serviceIdentifier) as TService;
    }

    getEventHandlers(): IterableIterator<[string, any]> {
        return this.event_handlers.entries();
    }

    on(lifecycle: any): void {}

    private async initializeServiceAsync(): Promise<void> {
        // load service
        for (const service of this.services.values()) {
            await (service as any)._startUp(this);
        }
    }

    // override
    public async initializeEventHandlerAsync(): Promise<void> {
        throw '"initializeEventHandlerAsync" must be defined.';
    }

    async startUp(): Promise<void> {
        //@TODO fire lifecycle hook
        await this.initializeServiceAsync();
        await this.initializeEventHandlerAsync();
    }

    // abstract expose(): any;
}
