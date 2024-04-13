import { TableModel } from '../../data_model';

export interface PG_CONFIG_DEPLOY_HISTORY_Key {
    DEPLOY_SID: string;
}

export interface PG_CONFIG_DEPLOY_HISTORY extends TableModel<PG_CONFIG_DEPLOY_HISTORY_Key> {
    OBJECT_SID: string;
    CONFIG_SID?: string;
    VERSION_NO: number;
    BEFORE_CONTENTS?: string;
    AFTER_CONTENTS?: string;
    TEMPLATE_CONTENTS?: string;
    DEPLOY_PATH: string;
    RESTORE_SID?: string;
    WRITER_ID: string;
    WRITE_DT: string;
}
