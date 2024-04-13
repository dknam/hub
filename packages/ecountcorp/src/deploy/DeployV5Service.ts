import path from 'path';
import { databaseApp } from '../api/databaseApp';
import { postServerSide } from '../api/serverApi';
import { ProcessType, RoboCopyType, ServiceBehavior } from '../enum';
import {
    DeployContext,
    IBranchDeployContextBase,
    IDeployV5Service,
    IServerSideRequest,
    IV5BranchDeployContext,
} from './types';
import { ServiceStateModel, ecountV5BasePath, ecountV5GitPath } from '../data_model';
import * as util from './util';
import { cacheFileService } from '.';
import { gitApp } from '../api/gitApp';
import { CommitModel } from '../data_model/gitModels';
import dayjs from 'dayjs';
import { DeployInfoService } from '../deployinfo/deployInfoService';

export const deployV5Service = ((): IDeployV5Service => {
    const deploy = async (context: DeployContext) => util.deploy(context);

    const deployV5_Branch = async (context: IV5BranchDeployContext) => {
        for (const process of v5BranchDeployProcess) {
            try {
                if (process.condition && !process.condition(context)) {
                    continue;
                }
                await process.action(context);
            } catch (err) {
                // err.message = `Deploy Error: ${proecess.desc}`
                throw err;
            }
        }
    };

    const stopWebService = async (context: IServerSideRequest & { serviceList?: ServiceStateModel[] }) => {
        const registerService = (
            await databaseApp.sendPost('SelectServiceAppInstallList', {
                OBJECT_SID: context.server.SERVER_SID,
            })
        )
            .filter((svc) => svc.VERSION === 5)
            .map((svc) => svc.SERVICE_NAME);

        context.serviceList = (
            await postServerSide('GetWinServiceStateViewList', {
                ServerData: context.server.serverM,
                LogKey: context.logkey,
                UserId: context.userID,
            })
        ).filter((svc) => registerService.includes(svc.ServiceName));

        context.serviceList?.forEach((svc) =>
            postServerSide('ControlService', {
                ServerData: context.server.serverM,
                ServiceBehavior: ServiceBehavior.Stop,
                ServiceName: svc.ServiceName,
                LogKey: context.logkey,
                UserId: context.userID,
            })
        );

        return true;
    };

    const restartWebService = async (context: IServerSideRequest & { serviceList?: ServiceStateModel[] }) => {
        const promises = context.serviceList?.map((svc) =>
            postServerSide('ControlService', {
                ServerData: context.server,
                UserId: context.userID,
                LogKey: context.logkey,
                ServiceBehavior: ServiceBehavior.Start,
                ServiceName: svc.ServiceName,
            })
        );

        if (promises) {
            const results = await Promise.all(promises);
            return results.reduce((a, b) => a && b, true);
        }

        return true;
    };

    const copyRuntimeFiles = async (request: IServerSideRequest) => {
        const results = await Promise.all([
            postServerSide('RobocopyProcess', {
                ServerData: request.server,
                LogKey: request.logkey,
                UserId: request.userID,
                RobocopyType: RoboCopyType.Folder,
                SrcPath: path.join(ecountV5GitPath, 'Runtime/'),
                DestPath: ecountV5BasePath,
                //ExcludeFiles: '', // todo
            }),

            postServerSide('RobocopyProcess', {
                ServerData: request.server,
                LogKey: request.logkey,
                UserId: request.userID,
                FileName: 'build_info.json',
                RobocopyType: RoboCopyType.File,
                SrcPath: path.join(ecountV5GitPath, 'build'),
                DestPath: ecountV5BasePath,
            }),
        ]);

        return results.reduce((a, b) => a && b, true);
    };

    const executeDeployScript = async (request: IServerSideRequest) => {
        const result = await postServerSide('ExcuteProcess', {
            ServerData: request.server,
            UserId: request.userID,
            LogKey: request.logkey,
            ProcessType: ProcessType.Deploy,
        });

        return result.ExitCode === 0;
    };

    const deployBranch = async (context: IBranchDeployContextBase & { preCommitInfo?: CommitModel }) => {
        context.preCommitInfo = await gitApp.sendPost('GetCommit', {
            GitRootPath: context.repository.REPO_FORDER,
            ShaId: `${context.repository.REMOTE_NAME}/${context.branch}`,
        });

        await util.checkoutServerSide(context);
    };

    const createVersionFile = async (context: IServerSideRequest & { preCommitInfo?: CommitModel }) => {
        if (!context.preCommitInfo) {
            return;
        }

        const content = JSON.stringify(context.preCommitInfo);
        await util.uploadToServer(
            context.server,
            content,
            path.join(ecountV5GitPath, 'git_version.json'),
            context.userID
        );
    };

    const deployConfig = () => {
        return Promise.resolve();
    };

    const deleteV5RuntimeDir = (request: IServerSideRequest) => {
        const exceptPath = ['']; // todo

        return postServerSide('DeleteDirectory', {
            ServerData: request.server.serverM,
            UserId: request.userID,
            LogKey: request.logkey,
            DirPath: ecountV5BasePath,
            ExceptPaths: exceptPath,
        });
    };

    const v5VersionUpdate = (request: IServerSideRequest) => {
        const version = dayjs().format('yyyyMMddmmssff');
        const service = new DeployInfoService(request.server);
        service.modify((model) => {
            model.V5_VERSION.V5 = version;
            return model;
        });
    };

    const deployPgPartitionFile = async (request: IServerSideRequest) => {
        const server = request.server;
        if ((server.serverGroup !== 'CENTER' && server.mainZone) || server.isLxLogin78) {
            await cacheFileService.uploadPgPartitionFile(request.server, request.userID);
        }
    };

    const executeResourceUploaderDiff = async (context: IBranchDeployContextBase) => {};

    const v5BranchDeployProcess = [
        { desc: '02 Stop WebService', action: stopWebService },
        { desc: '03 Deploy Branch', action: deployBranch },
        {
            desc: '04 Delete Runtime Directory',
            action: deleteV5RuntimeDir,
            condition: (context: IV5BranchDeployContext) => context.deleteAndBuild ?? false,
        },
        { desc: '05 Sync Runtime Directory', action: copyRuntimeFiles },
        { desc: '06 Execute Deploy Script', action: executeDeployScript },
        { desc: '07 Deploy Config', action: deployConfig },
        { desc: '08', action: executeResourceUploaderDiff },
        { desc: '09 Deploy PgPartion File', action: deployPgPartitionFile },
        { desc: '10. Restart WebService', action: restartWebService },
        { desc: '11. Create Version File', action: createVersionFile },
    ];

    return {
        deployV5_Branch,
        deploy,
        stopWebService,
        restartWebService,
        deployConfig,
        deployBranch,
        copyRuntimeFiles,
        executeDeployScript,
        deleteV5RuntimeDir,
        deployPgPartitionFile,
        v5BranchDeployProcess,
    };
})();
