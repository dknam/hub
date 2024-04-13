import { TableModel } from '.';

export interface PG_OBJECT_M_Key {
    OBJECT_SID: string;
}

export interface PG_OBJECT_M extends TableModel<PG_OBJECT_M_Key> {
    VERSION_NO: number;
    OBJECT_TYPE: ObjectType;
    SORT_NO: number;
    OBJECT_NM: string;
    OBJECT_DESC: string;
    USE_TF: boolean | null;
    DEPLOY_TF: boolean | null;
    WRITER_ID: string;
    WRITE_DT: string;
    UPDATER_ID: string;
    UPDATE_DT: string | null;
}
type ObjectType = 'server_group' | 'zone' | 'role' | 'server' | 'cloud';
