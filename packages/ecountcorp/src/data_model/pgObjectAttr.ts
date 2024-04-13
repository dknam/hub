import { TableModel } from '.';

export interface PG_OBJECT_ATTR_Key {
    OBJECT_SID: string;
    ATTR_ID: string;
}

export interface PG_OBJECT_ATTR extends TableModel<PG_OBJECT_ATTR_Key> {
    VERSION_NO: number;
    ATTR_VALUE: string;
}
