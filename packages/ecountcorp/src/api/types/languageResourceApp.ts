export interface RESX_D {
    RESX_D_SID?: string;
    RESX_SID?: string;
    LAN_TYPE?: string;
    CONTENTS?: string;
    WRITE_ID?: string;
    WRITE_DT?: string;
    UPDATE_ID?: string;
    UPDATE_DT?: string;
}

export interface SearchResourceModel extends RESX_D {
    RESX_CODE?: string;
    USE_TF?: string;
    TRANS_TF?: string;
    REMARKS?: string;
    FROM_CDT?: string;
    TO_CDT?: string;
    FROM_MDT?: string;
    TO_MDT?: string;
    PAGE_SIZE?: number;
    PAGE_CURRENT?: number;
    OLD_TF?: string;
    MEAN_KR?: string;
    MEAN_EN?: string;
}

export interface SearchResourceResultModel extends RESX_D {
    MAXCNT?: number;
    RESX_CODE?: string;
    TRANS_TF?: boolean;
    REMARKS?: string;
    MEAN_KR?: string;
    MEAN_EN?: string;
}
