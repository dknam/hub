import { Arr, Str } from '@ecdh/util';
import { TableModel } from '../../data_model';
import { PG_OBJECT_M } from '../../data_model/pgObjectM';
import { ServerModel } from '../../data_model/serverModel';
import { BindConfigFeature } from '../bindConfigFeature';
import { PG_CONFIG_ALIAS } from './pgConfigAlias';
import { PG_CONFIG_DEPLOY_HISTORY } from './pgConfigDeployHistory';
import { PG_CONFIG_M } from './pgConfigM';
import { StringBuilder } from '../../data_model/stringBuilder';

export interface ConfigModel extends PG_CONFIG_M {
    AliasList: PG_CONFIG_ALIAS[];
    BASE_DIR: string;
    Template: string;
}

export interface DeployConfigRequestModel extends Partial<PG_CONFIG_DEPLOY_HISTORY> {
    Config: ConfigModel;
    Server: ServerModel;
    Zone: string;
    IsDeploy: boolean;
}
export const commonAliasSID = '000000000000000';
export const nameTokens = ['}', '=', '('];
export const argGroupRegExp = new RegExp(/\[([a-zA-Z]\w+(\|[a-zA-Z]\w+)+)\]/g);
export const argIndexRegExp = new RegExp(/@((?<idx>\d)|\{(?<idx>\d)(:(?<default>@\d|\w+))?\})/g);
export const attrOnlyRegExp = new RegExp(/^attr\((?<attr_id>[^∬]*)\)/gi);
export const zoneRegExp = new RegExp(/zone\((?<zone>[^∬]*)\)/gi);
export const roleRegExp = new RegExp(/role\((?<role>[^∬]*)\)/gi);
export const groupRegExp = new RegExp(/group\((?<server_group>[^∬]*)\)/gi);
export const attrRegExp = new RegExp(/attr\((?<attr_id>[^∬]*)\)/gi);
export const roleOptionRegExp = new RegExp(/role\([^∬]*\)∬opt\((?<option>[^∬]*)\)/gi);
export const groupOnlyRegExp = new RegExp(/group\((?<server_group>[^∬]*)\)∬attr\((?<attr_id>[^∬]*)\)/gi);
export const defineRegExp = new RegExp(/define\((?<attr_id>[^∬]*)\)/gi);
export const listRegExp = new RegExp(/list\((?<list_type>[^∬]*)\)/gi);

export interface ResolveFilter {
    required?: boolean;
    protected?: boolean;
    lowerCase?: boolean;
    trim?: boolean;
}

export * from './pgConfigM';
export * from './pgConfigAlias';
export * from './defineAliasDict';
