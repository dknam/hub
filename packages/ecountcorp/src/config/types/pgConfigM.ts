import { TableModel } from '../../data_model';

export interface PG_CONFIG_M_Key {
    CONFIG_SID: string;
}
export interface PG_CONFIG_M extends TableModel<PG_CONFIG_M_Key> {
    VERSION_NO: number;
    CONFIG_TYPE: string;
    CONFIG_NM: string;
    CONFIG_DESC: string;
    SORT_NO: number;
    DEPLOY_PATH: string;
    SOURCE_PATH: string;
    TEMPLATE_PATH: string;
    USE_TF: boolean | null;
    WRITER_ID: string;
    WRITE_DT: string;
    UPDATER_ID: string;
    UPDATE_DT: string | null;
}
