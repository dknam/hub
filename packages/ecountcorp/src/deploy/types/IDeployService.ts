import { ProcessResultModel } from '../../api/types';
import { BuilderType, OS } from '../../enum';
import {
    DeployContext,
    IBranchDeployContextBase,
    IServerSideRequest,
    ISolutionDeployContextBase,
    IV3BranchDeployContext,
    IV3DeployContextBase,
    IV3FileDeployContext,
    IV5BranchDeployContext,
} from '.';
import { ServerModel } from '../../data_model/serverModel';
import { REPOSITORY } from '../../data_model/gitModels';
import { ServiceStateModel } from '../../data_model';

export interface IDeployServiceBase {
    deploy: (context: DeployContext) => Promise<void>;
    deployConfig: () => Promise<void>;
}
export interface IDeployV3Service extends IDeployServiceBase {
    stopWebService: (context: IServerSideRequest) => Promise<boolean>;
    restartWebService: (context: IServerSideRequest) => Promise<boolean>;
    deployV3_Branch: (context: IV3BranchDeployContext) => Promise<void>;
    deployV3_File: (context: IV3FileDeployContext) => Promise<void>;
    stopGitService: (context: IServerSideRequest) => Promise<boolean>;
    stopGitExe: (context: IServerSideRequest) => Promise<boolean>;
    deployBranch: (context: IBranchDeployContextBase) => Promise<void>;
    deleteGitLockFile: (context: ISolutionDeployContextBase) => Promise<void>;
    executeBuilder: (context: IV3DeployContextBase) => Promise<ProcessResultModel>;
    executeOptimizer: (context: ISolutionDeployContextBase) => Promise<ProcessResultModel>;
    getBuilderTypeByServer: (server: ServerModel) => BuilderType;
    getBuilderTypeByRepository: (repository: REPOSITORY) => BuilderType;
    v3BranchDeployProcess: {
        desc: string;
        condition?: (context: IV3BranchDeployContext) => boolean;
        action: (context: IV3BranchDeployContext) => Promise<void | ProcessResultModel | boolean>;
    }[];
    v3FileDeployProcess: {
        desc: string;
        condition?: (context: IV3FileDeployContext) => boolean;
        action: (context: IV3FileDeployContext) => Promise<void | ProcessResultModel | boolean>;
    }[];
}

export interface IDeployV5Service extends IDeployServiceBase {
    stopWebService: (context: IServerSideRequest & { serviceList?: ServiceStateModel[] }) => Promise<boolean>;
    restartWebService: (context: IServerSideRequest & { serviceList?: ServiceStateModel[] }) => Promise<boolean>;
    deployV5_Branch: (context: IV5BranchDeployContext) => Promise<void>;
    deployBranch: (context: IV5BranchDeployContext) => Promise<void>;
    copyRuntimeFiles: (request: IServerSideRequest) => Promise<boolean>;
    executeDeployScript: (request: IServerSideRequest) => Promise<boolean>;
    deleteV5RuntimeDir: (request: IServerSideRequest) => Promise<boolean>;
    deployPgPartitionFile: (request: IServerSideRequest) => Promise<void>;
    v5BranchDeployProcess: {
        desc: string;
        condition?: (context: IV5BranchDeployContext) => boolean;
        action: (context: IV5BranchDeployContext) => Promise<void | boolean>;
    }[];
}

export interface ICacheFileService {
    createPgPartitionFileContent: (server: ServerModel) => Promise<string | null>;
    createPrgIdConnInfoFileContent: (server: ServerModel, zone: string) => Promise<string | null>;
    createUserIdPkTableFileContent: (server: ServerModel) => Promise<string> | null;
    uploadPgPartitionFile: (server: ServerModel, userID: string) => Promise<void>;
    uploadPrgIdConnInfoFile: (server: ServerModel, userID: string) => Promise<void>;
    uploadUserIdPkTableFile: (server: ServerModel, userID: string) => Promise<void>;
    getPrgIdConnInfoPath: (serverOS: OS, zone: string) => string;
    getPgPartitionFilePath: (serverOS: OS) => string;
    getUserIdPkTableFilePath: (serverOS: OS, zone: string) => string;
}
