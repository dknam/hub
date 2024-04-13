import { ConfigModel } from '../../data_model';
import { IBranchDeployContextBase, IServerSideRequest } from '.';

export interface IConfigDeployContextBase extends IServerSideRequest {
    configList?: ConfigModel[];
}

export interface IConfigBranchDeployContext extends IConfigDeployContextBase, IBranchDeployContextBase {}

export interface IConfigServerDeployContext extends IConfigDeployContextBase {}

export type ConfigDeployContext = IConfigBranchDeployContext | IConfigServerDeployContext;
