import dayjs from 'dayjs';
import { postServerSide, upload } from '../api/serverApi';
import { ServerModel } from '../data_model/serverModel';
import { DeployContext, IBranchDeployContextBase } from './types';
import { deployV3Service, deployV5Service } from '.';

export const deploy = (context: DeployContext) => {
    switch (context.type) {
        case 'V3_BRANCH':
            return deployV3Service.deployV3_Branch(context);
        case 'V3_FILE':
            return deployV3Service.deployV3_File(context);
        case 'V5_BRANCH':
            return deployV5Service.deployV5_Branch(context);
        default:
            throw new Error('INVALID_DEPLOY_TYPE');
    }
};

export const uploadToServer = (server: ServerModel, fileContent: string, filePath: string, userID: string) => {
    return upload({
        ServerData: server.serverM,
        FullPath: filePath,
        Bytes: new TextEncoder().encode(fileContent),
        UserId: userID,
    });
};

export const checkoutServerSide = async (context: IBranchDeployContextBase) => {
    await postServerSide('Commit', {
        BaseDir: context.repository?.REPO_FORDER!,
        CommitMessage: `backup_${dayjs().format('YYYYMMDDmmss')}`,
        LogKey: context.logkey,
        ServerData: context.server,
        UserId: context.userID,
        AllowEmpty: true,
    });

    await postServerSide('Checkout', {
        ServerData: context.server,
        UserId: context.userID,
        LogKey: context.logkey,
        Repository: context.repository,
        RefId: context.branch,
    });

    // log insert
};
