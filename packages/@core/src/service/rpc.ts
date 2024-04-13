import { eccommand } from '../application';
import { IEcCommand } from '../application/command';
import { ECountService, IECountService } from './service';

// 각 플랫폼 별로 implements
//  - VscodeRpcService: webview api
//  - ElectronRpcService: electron api(ipcMan / ipcRenderer)
//  - BrowserRpcService: websocket(http)

export const IECountRpcService = 'IECountRpcService';
export interface IECountRpcService extends IECountService {}

export abstract class ECountRpcService extends ECountService implements IECountRpcService {
    abstract send<TCommand extends IEcCommand>(command: TCommand): Promise<void>;
    abstract on(): Promise<void>;
    abstract startUp(): Promise<void>;
}
