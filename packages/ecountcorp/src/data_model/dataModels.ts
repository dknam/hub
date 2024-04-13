import { Str } from '@ecdh/util';
import { ecountSeparator } from '.';
import { ServerModel } from './serverModel';
import { ServiceControllerStatus } from '../enum';

export interface SERVER_M {
    SERVER_CD?: number;
    OS?: string;
    MACHINE_NM?: string;
    SERVER_NM?: string;
    SERVER_IP?: string;
    SERVER_GROUP?: string;
    ZONES?: string;
    ROLES?: string;
    SORT_NO?: number;
    USE_YN?: boolean;
}

export class ServerData implements SERVER_M {
    SERVER_CD?: number;
    OS?: string;
    MACHINE_NM?: string;
    SERVER_NM?: string;
    SERVER_IP?: string;
    SERVER_GROUP?: string;
    ZONES?: string;
    ROLES?: string;
    SORT_NO?: number;
    USE_YN?: boolean;
    OBJECT_SID?: string;
    SUB_DOMAIN?: string;
    L7_SERVER_CD?: number;
    L7_NM?: string;
    SERVER_IP_PUBLIC?: string;
    DB_TYPE?: string;
    PORT?: string;
    CONN_ID?: string;
    CONN_STR?: string;
    CLOUD_NM?: string;
    ACCESS_TYPE?: string;
    REGION?: string;
    SUBNET_ID?: string;
    SECURITY_ID?: string;
    INSTANCE_TYPE?: string;
    CLOUD_SERVER_TYPE?: string;
    ON_TIME?: string;
    ON_USER?: string;
    OFF_TIME?: string;
    OFF_USER?: string;
    IS_CREATED?: boolean;
    IS_AUTOSCALE_SERVER?: boolean;
    ENABLE_ZONES?: string;
    ENABLE_DBTYPES?: string;
    COPY_DATE?: string;
    COPY_USER?: string;

    get ZONE_LIST(): string[] {
        return !this.ZONES ? [] : Str.split(this.ZONES, ecountSeparator);
    }
}

export interface VirtualPartitionInfo {
    table?: string;
    comcode?: string;
}

export interface REPOSITORY {
    KEY: {
        PROJECT_ID: string;
        IS_PRODUCT: boolean;
    };
    GIT_URL?: string;
    REPO?: string;
    REPO_NM?: string;
    REPO_FORDER?: string;
    ARTIFACT?: boolean;
    ARTIFACT_SITE?: string;
    SOLUTION_NM?: string;
    REG_DATE?: Date;
    REMOTE_NAME?: string;
    SHORT_SOLUTION_NM?: string;
}

export interface PrgIdConnInfo {
    prg_id?: string;
    parent_prg_id?: string;
    bizz_sid?: string;
    menu_sid?: string;
    group_sid?: string;
    parent_group_sid?: string;
    type?: string;
    trx_type?: string;
    ser_no?: string;
}

export interface FileInfo {
    Name?: string;
    FullName?: string;
    DirectoryName?: string;
    Extension?: string;
    CreationTime?: Date;
    LastWriteTime?: Date;
    Exists?: boolean;
    Length?: number;
    ContentsBase64?: string;
}
export interface TableModel<TKey> {
    Key: TKey;
}
export interface ConfigAlias {
    Key?: {
        CONFIG_SID?: string;
        ALIAS?: string;
    };
    VERSION_NO?: number;
    ALIAS_DESC?: string;
    ALIAS_VALUE?: string;
    WRITER_ID?: string;
    WRITE_DT?: Date;
    UPDATER_ID?: string;
    UPDATE_DT?: Date;
}

export interface ConfigModel {
    Key?: { CONFIG_SID: string };
    VERSION_NO?: string;
    CONFIG_TYPE?: string;
    CONFIG_NM?: string;
    CONFIG_DESC?: string;
    SORT_NO?: number;
    DEPLOY_PATH?: string;
    SOURCE_PATH?: string;
    TEMPLATE_PATH?: string;
    USE_TF?: boolean;
    WRITER_ID?: string;
    WRITE_DT?: Date;
    UPDATER_ID?: string;
    UPDATE_DT?: Date;
    ALiasList?: ConfigAlias[];
    BASE_DIR?: string;
    Template?: string;
}

export class ServiceStateModel {
    public ServerInfo?: SERVER_M;
    public ServiceName?: string;
    public Status?: ServiceControllerStatus;
    public ServicePath?: string;
    public AccountName?: string;
    public Description?: string;
    public DisplayName?: string;
    public Plugins?: string;

    public get ServerFullName() {
        return this.ServerInfo?.SERVER_NM;
    }
}

export interface EcountV5ServiceModel {
    SERVICE_NAME?: string;
    DESCRIPTION?: string;
    VERSION?: string;
    HOME_DIR?: string;
    BIN_DIR?: string;
    EXEC?: string;
    ARGS?: string;
    AUTO_START?: boolean;
    WRITE_ID?: string;
    WRITE_DT?: string;
    UPDATE_ID?: string;
    UPDATE_DB?: string;
    SERVER_DIVISION?: string;
    RESTART_TYPE?: string;
    START_POST?: string;
    ON_FAILURE?: string;
}
