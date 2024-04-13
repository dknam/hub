import { ServerApiRequest } from '.';
import { PG_CONFIG_MACRO } from '../../data_model/pgConfigMacro';
import { PG_OBJECT_ATTR } from '../../data_model/pgObjectAttr';
import { PG_OBJECT_M } from '../../data_model/pgObjectM';

export interface ServerListRequest {
    server_cd?: number;
    server_group?: string;
    server_nm?: string;
    server_ip?: string;
    roles?: string;
    zones?: string;
    use_yn?: boolean;
}

export interface DeployJobFilesDto extends ServerApiRequest {
    fullPath?: string;
    serverPath?: string;
    isFileContents?: boolean;
}

export interface GetSSDBPathsDto {
    ServerGroup?: string;
    Zone?: string;
}

export interface GetSSDBHashDto {
    ServerGroup?: string;
    Zone?: string;
    Path?: string;
}

export interface GetSSDBKeysDto {
    ServerGroup?: string;
    Zone?: string;
    Path?: string;
    Hash?: string;
    Key?: string;
}

export interface GetSSDBKeyValueDto {
    ServerGroup?: string;
    Zone?: string;
    Path?: string;
    Hash?: string;
    Key?: string;
}

export interface TB_CACHE_LINK {
    CACHE_NAME: string;
    TABLE_NAME: string;
    TABLE_REMARK: string;
    ISREGEX: boolean;
    REGEX: string;
    SP_NAME: string;
    USE_YN: boolean;
    SORT: number;
    BASE_KEY: ENUM_BASE_KEY;
    SSDB_NAME: string;
    IS_PG: boolean;
}
export type ENUM_BASE_KEY = 'BASE_TYPE' | 'PRG_ID' | 'CLASS_CD' | 'FORM_TYPE';
export interface GetListConfigMacroRequest {
    CONFIG_SID?: string;
    MACRO_NM?: string;
    MACRO_VALUE?: string;
    MACRO_DESC?: string;
    CONFIG_TYPE?: string;
}
export interface GetListConfigMacroResult extends PG_CONFIG_MACRO {
    CONFIG_TYPE: string;
    CONFIG_NM: string;
    DEPLOY_PATH: string;
}
export interface ObjectServerResultModel extends PG_OBJECT_M {
    ATTR_ID: string;
    ATTR_VALUE: string;
}
export interface GetListObjectFromAttrIdRequest {
    ATTR_ID: string;
    SERVER_GROUP?: string;
    ZONE?: string;
    ROLE?: string;
}
export interface ObjcetServerRequestModel {
    OBJECT_SID?: string;
    SERVER_GROUP?: string;
    ZONE?: string;
    ROLE?: string;
    DEPLOY_TF?: boolean;
    USE_TF?: boolean;
    NAME?: string;
    DESC?: string;
    ATTR_ID?: string;
    ATTR_VALUE?: string;
}

export interface ObjectRequestDto extends ObjcetServerRequestModel {
    OBJECT_TYPE?: string;
}

export interface GetObjectResponseDto extends PG_OBJECT_M {
    Attributes?: PG_OBJECT_ATTR[];
}
