import { TableModel } from '.';

export interface PG_CONFIG_ALIAS_EXCEPTION_Key {
    EXCEPTION_SID: string;
}

export interface PG_CONFIG_ALIAS_EXCEPTION extends TableModel<PG_CONFIG_ALIAS_EXCEPTION_Key> {
    CONFIG_SID: string;
    OBJECT_SID: string;
    EXCEPTION_KEY: string;
    USE_TF: boolean;
    WRITER_DT: string | null;
    WRITER_ID: string;
    EDIT_DT: string | null;
    EDIT_ID: string;
}
