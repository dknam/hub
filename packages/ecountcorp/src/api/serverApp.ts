import { PG_CONFIG_ALIAS_EXCEPTION } from '../data_model/pgConfigAliasException';
import { ServerData } from '../data_model';
import { ObjectModel } from '../data_model/objectModel';
import { PG_OBJECT_RELATION } from '../data_model/pgObjectRelation';
import ContractBase from './contractBase';
import {
    DeployJobFilesDto,
    ServerListRequest,
    GetSSDBPathsDto,
    GetSSDBHashDto,
    GetSSDBKeysDto,
    TB_CACHE_LINK,
    GetListConfigMacroRequest,
    GetListConfigMacroResult,
    ObjectServerResultModel,
    GetListObjectFromAttrIdRequest,
    ObjectRequestDto,
    GetObjectResponseDto,
} from './types';

class ServerApp extends ContractBase {
    constructor() {
        super('ECount.Deploy.ServerManagementApp', 'ECount.Deploy.ServerManagementApp.ServerManagementAppFeatures');
    }

    async sendPost(funcName: 'GetListObject', body: ObjectRequestDto): Promise<GetObjectResponseDto[]>;
    async sendPost(funcName: 'GetListObjectRelation', body: PG_OBJECT_RELATION): Promise<PG_OBJECT_RELATION[]>;
    sendPost(funcName: 'GetListCacheLinkData', body: Partial<TB_CACHE_LINK>): Promise<TB_CACHE_LINK[]>;
    async sendPost(funcName: 'GetSSDBPaths', body: GetSSDBPathsDto): Promise<Array<string>>;
    async sendPost(funcName: 'GetSSDBHashs', body: GetSSDBHashDto): Promise<Array<string>>;
    async sendPost(funName: 'GetSSDBKeys', body: GetSSDBKeysDto): Promise<Array<string>>;
    async sendPost(a: 'GetServerList', b: ServerListRequest): Promise<ServerData[]>;
    async sendPost(a: 'DeployJobFiles', b: DeployJobFilesDto): Promise<boolean>;
    async sendPost(a: 'GetListConfigAliasExcpetion', b: { CONFIG_SID: string }): Promise<PG_CONFIG_ALIAS_EXCEPTION[]>;
    async sendPost(a: 'GetListConfigMacro', b: GetListConfigMacroRequest): Promise<GetListConfigMacroResult[]>;
    sendPost(
        funcName: 'GetListObjectFromAttrId',
        body: GetListObjectFromAttrIdRequest
    ): Promise<ObjectServerResultModel[]>;
    sendPost(
        funcName: 'GetListListTypeR',
        body: { Key?: { LIST_TYPE_D_SID: string } }
    ): Promise<ObjectServerResultModel[]>;
    async sendPost<TRequest, TResult>(a: string, b: TRequest): Promise<TResult> {
        return this.post<TRequest, TResult>(a, b);
    }
}

export const serverApp = new ServerApp();
