import { IConfigBranchDeployContext } from '.';
import { FileInfo, ServiceStateModel } from '../../data_model';
import { CommitModel, REPOSITORY } from '../../data_model/gitModels';
import { ServerModel } from '../../data_model/serverModel';

export interface IServerSideRequest {
    server: ServerModel;
    userID: string;
    logkey?: string;
}

interface IDeployContextBase extends IServerSideRequest {
    type?: string;
}
export interface ISolutionDeployContextBase extends IServerSideRequest {
    repository: REPOSITORY;
}
export interface IFileDeployContextBase extends IServerSideRequest {
    fileList: FileInfo[];
}
export interface IBranchDeployContextBase extends ISolutionDeployContextBase {
    branch: string;
}
export interface IV3DeployContextBase extends IDeployContextBase, ISolutionDeployContextBase {
    isRebuild?: boolean;
}
export interface IV5DeployContextBase extends IDeployContextBase, ISolutionDeployContextBase {
    deleteAndBuild?: boolean;
    serviceList?: ServiceStateModel[];
}

export interface IV3BranchDeployContext
    extends IV3DeployContextBase,
        IBranchDeployContextBase,
        IConfigBranchDeployContext {
    type: 'V3_BRANCH';
}
export interface IV3FileDeployContext extends IV3DeployContextBase, IFileDeployContextBase {
    type: 'V3_FILE';
}
export interface IV5BranchDeployContext
    extends IV5DeployContextBase,
        IBranchDeployContextBase,
        IConfigBranchDeployContext {
    type: 'V5_BRANCH';
    preCommitInfo?: CommitModel;
}

export type DeployContext = IV3BranchDeployContext | IV3FileDeployContext | IV5BranchDeployContext;
