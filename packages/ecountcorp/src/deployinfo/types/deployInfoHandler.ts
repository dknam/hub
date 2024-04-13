import { ServerData } from '../../data_model';
import { DeployInfoModel } from './deployInfoModel';

export interface IDeployInfoHandler {
    filePath: string;
    read(server: ServerData): Promise<string>;
    save(server: ServerData, model: DeployInfoModel, logKey: string): Promise<void>;
    parse(content: string): DeployInfoModel;
    toString(model: DeployInfoModel): string;
}
