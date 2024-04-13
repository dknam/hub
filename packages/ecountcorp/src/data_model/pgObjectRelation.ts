import { TableModel } from './dataModels';

export interface PG_OBJECT_RELATION {
    Key?: {
        OBJECT_SID?: string;
        RELATION_SID?: string;
    };
    OBJECT_TYPE?: string;
    RELATION_TYPE?: string;
}
