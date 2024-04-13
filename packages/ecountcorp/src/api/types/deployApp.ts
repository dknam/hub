export interface JOB_DETAIL {
    JOB_SID?: string;
    JOB_CD?: string;
    JOB_NM?: string;
    REPO?: string;
    USER_ID?: string;
    DEPLOY_DT?: string;
    JOB_TYPE?: string;
    JOB_MEMO?: string;
    PRE?: boolean | null;
    SOLUTION_NM?: string;
    FIRST_CHECK?: boolean | null;
    BRANCH?: string;
    TESTER?: string;
    BUILD_YN?: boolean | null;
    WRITE_ID?: string;
    WRITE_DT?: Date;
    EDIT_ID?: string;
    EDIT_DT?: Date;
    SERVICE_NM?: string;
    IS_DEPLOY_REGISTED_FILE?: boolean | null;
}

export interface JOB_FILEINFO {
    FILE_CD?: number;
    JOB_SID?: string;
    FILE_NM?: string;
    WORK_SORT?: number | null;
    FILE_SORT?: number | null;
    SYNC_SET?: string;
    CONFIRM_STATUS?: string;
    CONFIRM_DATE?: string | null;
    MEMO?: string;
    LOCAL_PATH?: string;
    SERVER_PATH?: string;
    LOCK?: boolean | null;
    WRITE_DT?: Date | null;
    DO_RESTORE?: boolean | null;
    CUSTOM_SORT?: number | null;
    IS_SCHEMA_WARNING?: boolean | null;
    UDP_QUERY?: string;
    SVC_SYNC?: boolean | null;
}

export interface JobInfo extends JOB_DETAIL {
    FILE_CNT?: number;
    DB_DATA_CNT?: number;
    DB_DATA_CONFIRM_CNT?: number;
    //JOB_SID?: string;
    JOB_CD?: string;
    JOB_NM?: string;
    REPO?: string;
    USER_ID?: string;
    DEPLOY_DT?: string;
    JOB_TYPE?: string;
    JOB_MEMO?: string;
    PRE?: boolean;
    SOLUTION_NM?: string;
    FIRST_CHECK?: boolean;
    BRANCH?: string;
    TESTER?: string;
    BUILD_YN?: boolean;
    WRITE_ID?: string;
    WRITE_DT?: Date;
    EDIT_ID?: string;
    EDIT_DT?: Date;
    SERVICE_NM?: string;
    IS_DEPLOY_REGISTED_FILE?: boolean;
}

export interface JobFileInfo extends JobInfo, JOB_FILEINFO {
    SORT_NO?: number;
    FILE_NM?: string;
    LOCAL_PATH?: string;
    SERVER_PATH?: string;
    ADD_SUBFOLDER_SERVER_PATH?: string;
    FILE_EXTENSION?: string;
    CONFIRM_YN?: boolean | null;
    LOCK?: boolean | null;
    CONFIRM_ID?: string;
    CONFIRM_DATE?: string;
    DIV?: string;
    PROJECT_ID?: string;
    FILE_IMG?: string;
    FILE_CONTENTS?: string;
    FILE_CD?: number;
    CONFIRM_STATUS?: 'REQUEST' | 'CONFIRM' | 'CANCEL_REQUEST' | 'CANCELED';
    FILE_REGDATE?: string | null;
    CUSTOM_SORT?: number | null;
    IS_SCHEMA_WARNING?: boolean | null;
    UDP_QUERY?: string;
    SYNC_SET?: string;
    WORK_SORT?: number | null;
    FILE_SORT?: number | null;
    MEMO?: string;
    SVC_SYNC?: boolean;
    WRITE_DT?: Date;
}

export interface SearchJobFileRequestDto {
    FROM_DT?: string;
    TO_DT?: string;
    JOB_CD?: string;
    USER_ID?: string;
    REPO?: string;
    FILE_NM?: string;
    BRANCH?: string;
    FILE_CD?: number;
}
