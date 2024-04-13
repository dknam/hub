export interface DeployInfoModel {
    EnableNol4: boolean;
    EnableAPM: boolean;
    StoredProcedures: string;
    PGSQL: {
        Enabled: boolean;
        Features: {
            [key: string]: boolean;
        };
    };
    LOCALDB: {
        Enabled: boolean;
        Features: {
            [key: string]: boolean;
        };
    };
    PGCOMMONBAL: {
        Enabled: boolean;
        Features: {
            [key: string]: boolean;
        };
    };
    ETC_FLAG: {
        Enabled?: boolean;
        Features: {
            [key: string]: boolean;
        };
    };
    V5_FLAG: {
        Enabled: boolean;
        Features: {
            [key: string]: boolean;
        };
    };
    RefreshTimeStamp: number;
    SSDB: {
        ConnectionId?: string;
        Active: boolean;
        Enabled: boolean;
        ExpireTime?: string;
        EntityCache: SSDBEntityCacheV3 | SSDBEntityCacheV5;
        // EntityCache: {
        //     Nol4Targets: string;
        //     DisableTargets: string;
        //     DisableCategories: string;
        // };
    };
    CLOSE_FORMTYPE: {
        Enabled?: true;
        Features: {
            [key: string]: true;
        };
    };
    CLOSE_PAGE: {
        Enabled?: true;
        Features: {
            [key: string]: true;
        };
    };
    CLOSE_PERMISSION: {
        Enabled?: true;
        Features: {
            [key: string]: true;
        };
    };
    CLOSE_TEMPLATE: {
        Enabled?: true;
        Features: {
            [key: string]: true;
        };
    };
    ALERT_CNT: boolean;
    TableSchema: {
        CacheVersion: string;
    };
    V5_VERSION: {
        V5: string;
    };
    MENU_VERSION: {
        MENU: string;
    };
    ShardSetting: {
        DisabledShard: string;
    };
    CLOSETIME?: string;
}

export interface SSDBEntityCacheV5 {
    Nol4Targets: string;
    DisableTargets: string;
    DisableCategories: string;
}
export interface SSDBEntityCacheV3 {
    [key: string]: {
        DisableCategory: boolean;
        Nol4Targets: string;
        DisableTargets: string;
    };
}
