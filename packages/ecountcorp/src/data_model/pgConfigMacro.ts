import { TableModel } from '.';

export interface PG_CONFIG_MACRO_Key {
    CONFIG_SID: string;
    MACRO_NM: string;
}

export interface PG_CONFIG_MACRO extends TableModel<PG_CONFIG_MACRO_Key> {
    MACRO_VALUE: string;
    MACRO_DESC: string;
    WRITER_ID: string;
    WRITE_DT: string;
    UPDATER_ID: string;
    UPDATE_DT: string | null;
}
