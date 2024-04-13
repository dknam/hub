import { eccommand } from '../application';
import { ServiceIdentifier } from '../base';
import { IECountService, ECountService } from './service';

// menu -
// view -

// export const IECountRouteService = new ServiceIdentifier('IECountRouteService');
export const IECountRouteService = 'IECountRouteService';
export interface IECountRouteService<TPlatformBasedContext, TMenuTree> extends IECountService<TPlatformBasedContext> {
    getTreeItem(id: string): TMenuTree | undefined;
    getChildren(element?: string): Promise<string[]>;
    changeView(command: eccommand.ViewCommand): Promise<void>;
}

export abstract class ECountRouteService<TPlatformBasedContext, TMenuTree extends { id?: string }>
    extends ECountService<TPlatformBasedContext>
    implements IECountRouteService<TPlatformBasedContext, TMenuTree>
{
    constructor(protected menus: TMenuTree[]) {
        super();
    }

    abstract startUp(): Promise<void>;

    abstract changeView(command: eccommand.ViewCommand): Promise<void>;

    abstract loadMenu(): Promise<void>;

    async getChildren(element?: string): Promise<string[]> {
        const menus = Array.from(this.menus)
            // .filter((menu) => menu.displayMenuTree ?? true)
            .map((menu) => menu.id as string);

        return menus;
    }

    getTreeItem(id: string): TMenuTree | undefined {
        return this.menus.find((menu) => menu.id == id);
    }
}
