import { nanoid } from 'nanoid';
import { download, downloadToString, postServerSide, upload } from '../api/serverApi';
import { SERVER_M, ServerData } from '../data_model';
import { DeployInfoModel, IDeployInfoHandler } from './types';

export abstract class DeployInfoHandlerBase implements IDeployInfoHandler {
    abstract filePath: string;
    read(server: SERVER_M): Promise<string> {
        return downloadToString({
            ServerData: server,
            UserId: '정준호',
            FullPath: this.filePath,
        }).then((res) => res.replaceAll(/[\r\n\s]/g, ''));
    }
    save(server: SERVER_M, model: DeployInfoModel, logKey: string): Promise<void> {
        return upload({
            UserId: '정준호',
            ServerData: server,
            LogKey: logKey,
            Bytes: new TextEncoder().encode(model.toString()),
            FullPath: this.filePath,
        });
    }

    abstract parse(content: string): DeployInfoModel;
    abstract toString(model: DeployInfoModel): string;
}
