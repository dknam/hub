import { TableModel } from '.';

export interface PG_LIST_TYPE_R_Key {
    LIST_TYPE_D_SID: string;
    RELATION_SID: string;
    RELATION_VALUE: string;
}

export interface PG_LIST_TYPE_R extends TableModel<PG_LIST_TYPE_R_Key> {
    VALUE_DESC: string;
    WRITER_ID: string;
    WRITE_DT: string;
    UPDATER_ID: string;
    UPDATE_DT: string | null;
}
