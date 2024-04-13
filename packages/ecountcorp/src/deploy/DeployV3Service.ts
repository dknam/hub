import {
    DeployContext,
    IBranchDeployContextBase,
    IDeployV3Service,
    IFileDeployContextBase,
    IServerSideRequest,
    ISolutionDeployContextBase,
    IV3BranchDeployContext,
    IV3DeployContextBase,
    IV3FileDeployContext,
} from '.';
import { BuilderType, RoboCopyType } from '../enum';
import _ from 'lodash';
import { postServerSide } from '../api/serverApi';
import path from 'path';
import { inflate } from 'zlib';
import { ServerModel } from '../data_model/serverModel';
import * as util from './util';
import { REPOSITORY } from '../data_model/gitModels';

const webResourceRepositoryList = [
    'Artifact.ECERP_ECWebMail',
    'Artifact.ECERP_Invoice',
    'Artifact.ECERP_Master',
    'ECERP_ECWebMail',
    'ECERP_Invoice',
    'ECERP_Master',
    'ECWebMail',
    'ECInvoice',
    'ECERP',
];

const _builderFilePath = 'd:\\WebService\\WebResource\\ECountOptimizer\\builder\\ecount-builder.exe';
const _optimizerFilePath = 'd:\\WebService\\WebResource\\ECountOptimizer\\optimizer\\ecount-optimizer.exe';

export const deployV3Service = ((): IDeployV3Service => {
    const deploy = async (context: DeployContext) => util.deploy(context);

    const deployV3_File = async (context: IV3FileDeployContext) => {
        if (context.fileList.find((file) => file.Extension === '.dll') && isL7ActiveServer(context.server)) {
            throw new Error('Server is running!! invalid file type (.dll)');
        }

        for (const process of v3FileDeployProcess) {
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

    const deployV3_Branch = async (context: IV3BranchDeployContext) => {
        for (const process of v3BranchDeployProcess) {
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

    const deployConfig = async () => {
        Promise.resolve();
    };

    const stopWebService = async (request: IServerSideRequest) => {
        const result = await postServerSide('ExcuteProcess', {
            ServerData: request.server,
            UserId: request.userID,
            LogKey: request.logkey,
            Argument: 'iisreset /STOP',
        });

        return result.ExitCode === 0;
    };

    const restartWebService = async (request: IServerSideRequest) => {
        const result = await postServerSide('ExcuteProcess', {
            ServerData: request.server,
            UserId: request.userID,
            LogKey: request.logkey,
            Argument: 'iisreset /RESTART',
        });

        return result.ExitCode === 0;
    };

    const stopGitService = async (request: IServerSideRequest) => {
        const result = await postServerSide('ExcuteProcess', {
            ServerData: request.server,
            UserId: request.userID,
            LogKey: request.logkey,
            Argument: 'taskkill -im git-remote-http.exe',
        });

        return result.ExitCode === 0;
    };

    const stopGitExe = async (request: IServerSideRequest) => {
        const result = await postServerSide('ExcuteProcess', {
            ServerData: request.server,
            UserId: request.userID,
            LogKey: request.logkey,
            Argument: 'taskkill /im git.exe /f',
        });

        return result.ExitCode === 0;
    };

    const deleteGitLockFile = async (context: ISolutionDeployContextBase) => {
        const lockFiles = await postServerSide('GetSubDirectoryInfo', {
            ServerData: context.server,
            FullPath: path.join(context.repository.REPO_FORDER!, '.git'),
            UserId: context.userID,
        });

        await Promise.all(
            lockFiles
                .filter((file) => path.extname(file.FullName) === 'lock')
                .map((lockFile) => {
                    return postServerSide('DeleteServerFile', {
                        ServerData: context.server.serverM,
                        FullPath: lockFile.FullName,
                    });
                })
        );

        return;
    };

    const deployBranch = async (context: IBranchDeployContextBase) => {
        await util.checkoutServerSide(context);
    };

    const copyDbScript = async (context: ISolutionDeployContextBase | IFileDeployContextBase) => {
        if ('fileList' in context) {
            const promises = context.fileList
                .filter((file) => file.FullName?.includes('DBScripts'))
                .map((file) =>
                    postServerSide('RobocopyProcess', {
                        ServerData: context.server,
                        UserId: context.userID,
                        LogKey: context.logkey,
                        RobocopyType: RoboCopyType.File,
                        SrcPath: file.DirectoryName,
                        FileName: file.Name,
                        DestPath: '', // todo
                    })
                );
            await Promise.all(promises);
        } else if ('repository' in context) {
            await postServerSide('RobocopyProcess', {
                ServerData: context.server,
                UserId: context.userID,
                LogKey: context.logkey,
                BaseDir: context.repository.REPO_FORDER,
                RobocopyType: RoboCopyType.DbScripts,
                RepoName: context.repository.REPO,
            });
        }

        return true;
    };

    const copyWebResource = async (context: ISolutionDeployContextBase | IFileDeployContextBase) => {
        if ('fileList' in context) {
            const promises = context.fileList
                .filter((file) => file.FullName?.includes('WebResource'))
                .map((file) =>
                    postServerSide('RobocopyProcess', {
                        ServerData: context.server,
                        UserId: context.userID,
                        LogKey: context.logkey,
                        RobocopyType: RoboCopyType.File,
                        SrcPath: file.DirectoryName,
                        FileName: file.Name,
                        DestPath: '', // todo
                    })
                );
            await Promise.all(promises);
        } else if ('repository' in context) {
            await postServerSide('RobocopyProcess', {
                ServerData: context.server,
                UserId: context.userID,
                LogKey: context.logkey,
                BaseDir: context.repository.REPO_FORDER,
                RobocopyType: RoboCopyType.WebResource,
                RepoName: context.repository.REPO,
            });
        }

        return true;
    };

    const getBuilderTypeByRepository = (repository: REPOSITORY) => {
        switch (repository.REPO) {
            case 'Artifact.ECERP_ECWebMail':
            case 'ECERP_ECWebMail':
            case 'ECWebMail':
                return BuilderType.ECWebMail;
            case 'Artifact.ECERP_Invoice':
            case 'ECERP_Invoice':
            case 'ECInvoice':
                return BuilderType.ECINVOICE;
            case 'Artifact.ECERP_Master':
            case 'ECERP_Master':
            case 'ECERP':
                return BuilderType.ECERP;
            default:
                return BuilderType.None;
        }
    };

    const getBuilderTypeByServer = (server: ServerModel) => {
        if (server.ROLES?.includes('LOGIN')) {
            return BuilderType.ECERP;
        } else if (server.ROLES?.includes('ECWebMail')) {
            return BuilderType.ECWebMail;
        } else if (server.ROLES?.includes('INVOICE')) {
            return BuilderType.ECINVOICE;
        }
        return BuilderType.None;
    };

    const executeBuilder = async (context: IV3DeployContextBase) => {
        let builderType = getBuilderTypeByRepository(context.repository);
        if (builderType === BuilderType.None) {
            builderType = getBuilderTypeByServer(context.server);
        }

        if (builderType === BuilderType.None) {
            throw new Error('INVALID_BUILDER_TYPE');
        }

        // valid server
        const serverNm = context.server.serverGroup === 'CENTER' ? 'login' : context.server.serverGroup;
        const args = [
            `--type=${builderType}`,
            '--mode=production',
            `--server=${serverNm}`,
            `${context.isRebuild ? '--rebuild=1' : ''}`,
        ];

        return await postServerSide('ExcuteProcess', {
            ServerData: context.server,
            UserId: context.userID,
            LogKey: context.logkey,
            ProcessName: _builderFilePath,
            Argument: args.join(' '),
        });
    };

    const executeOptimizer = async (context: ISolutionDeployContextBase) => {
        if (context.server.serverGroup !== 'CENTER') return { Output: '', ExitCode: 0, IsError: false };

        let builderType = getBuilderTypeByRepository(context.repository);
        if (builderType === BuilderType.None) {
            builderType = getBuilderTypeByServer(context.server);
        }

        if (builderType === BuilderType.None) {
            throw new Error('INVALID_BUILDER_TYPE');
        }
        // valid server

        let s3Bucket = 'ecres';
        if (context.server.zoneList.find((zone) => zone === 'F')) {
            s3Bucket = 'ecrescn';
        } else if (context.server.zoneList.find((zone) => zone === 'IA')) {
            s3Bucket = 'ecressg';
        }

        const args = [`--type=${builderType}`, '--mode=production', `--s3=s3-${s3Bucket}`];

        return await postServerSide('ExcuteProcess', {
            ServerData: context.server.serverM,
            UserId: context.userID,
            LogKey: context.logkey,
            ProcessName: _optimizerFilePath,
            Argument: args.join(' '),
        });
    };

    const deployFiles = async (context: IFileDeployContextBase) => {
        context.fileList
            .filter((file) => file.FullName)
            .forEach((file) => {
                inflate(Buffer.from(file.ContentsBase64 ?? '', 'base64'), (err, decompressedData) => {
                    if (err) {
                        throw new Error('Decompress error!!');
                    }
                    util.uploadToServer(context.server, decompressedData.toString(), file.FullName!, context.userID);
                });
            });
    };

    const isWebResourceRepository = (repository: REPOSITORY) => {
        return webResourceRepositoryList.findIndex((repo) => repo === repository?.REPO) > 0;
    };

    const isL7ActiveServer = (server: ServerModel) => {
        return false;
    };

    const v3BranchDeployProcess = [
        { desc: '01. IIS Stop', action: stopWebService },
        { desc: '02. Stop Git Service', action: stopGitService },
        { desc: '03. Stop Git Exe', action: stopGitExe },
        { desc: '04. Delete Git LockFile', action: deleteGitLockFile },
        { desc: '05. Deploy Branch', action: deployBranch },
        {
            desc: '06. Deploy Config',
            action: deployConfig,
            condition: (context: ISolutionDeployContextBase) => context.repository.SHORT_SOLUTION_NM === 'ECERP',
        },
        { desc: '07. Copy DBScripts', action: copyDbScript },
        {
            desc: '08. Copy WebResource',
            action: copyWebResource,
            condition: (context: ISolutionDeployContextBase) => isWebResourceRepository(context.repository),
        },
        { desc: '09. Execute Builder', action: executeBuilder },
        { desc: '10. Execute Optimizer', action: executeOptimizer },
        { desc: '11. IIS Restart', action: restartWebService },
    ];

    const v3FileDeployProcess = [
        { desc: '01. Deploy Files', action: deployFiles },
        { desc: '02. Copy DBScripts', action: copyDbScript },
        {
            desc: '03. Copy WebResource',
            action: copyWebResource,
            condition: (context: ISolutionDeployContextBase) => isWebResourceRepository(context.repository),
        },
        { desc: '04. Execute Builder', action: executeBuilder },
        { desc: '05. Execute Optimizer', action: executeOptimizer },
    ];

    return {
        deployV3_Branch,
        deployV3_File,
        deployConfig,
        deploy,
        deleteGitLockFile,
        executeBuilder,
        executeOptimizer,
        restartWebService,
        stopWebService,
        stopGitExe,
        stopGitService,
        deployBranch,
        getBuilderTypeByRepository,
        getBuilderTypeByServer,
        v3BranchDeployProcess,
        v3FileDeployProcess,
    };
})();
