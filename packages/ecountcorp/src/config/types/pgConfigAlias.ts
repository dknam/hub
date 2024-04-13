import { TableModel } from '../../data_model';

export interface PG_CONFIG_ALIAS_Key {
    CONFIG_SID: string;
    ALIAS: string;
}

export interface PG_CONFIG_ALIAS extends TableModel<PG_CONFIG_ALIAS_Key> {
    VERSION_NO: number;
    ALIAS_DESC: string;
    ALIAS_VALUE: string;
    WRITER_ID: string;
    WRITE_DT: string;
    UPDATER_ID: string;
    UPDATE_DT: string | null;
}
