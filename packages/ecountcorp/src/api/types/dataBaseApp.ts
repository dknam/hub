import { TableInfoModel } from '../../database/tableInfoModel';
import { DatabaseType } from '../../database/types';

export type DatabaseProvider = 'PgSql' | 'MySql' | 'MyHbSql' | 'MsSql';

export interface WinServiceAppInfo {
    SERVICE_CD?: number;
    SERVICE_NAME?: string;
    SERVICE_FOLDER?: string;
    BASE_SERVICE_PATH?: string;
    SERVICE_PATH?: string;
    SERVICEAPP_TYPE?: 'WinSchedule' | 'WinService' | 'DownloadServer' | 'Process';
    MEMO?: string;
    WRITE_ID?: string;
    WRITE_DT?: string;
    USE_YN?: boolean;
    SCHEDULE_XML_NAME?: string;
    SOLUTION_ID?: string;
    ONLY_FILE?: boolean | null;
    DEFAULT_SYNC_YN?: string;
}

export interface ServerInfoModel {
    ServerGroup?: string;
    Zone?: string;
    DatabaseType?: DatabaseProvider;
    ConnectionId?: string;
}

export interface DatabaseInfoModel extends ServerInfoModel {
    DatabaseName?: string;
}

export interface ECTableInfo {
    DBNAME?: string;
    NAME?: string;
    COMMENTS?: string;
    DbType?: DatabaseProvider;
    IS_VIEW?: boolean;
}

export interface ECColumnInfo {
    NAME?: string;
    TYPE_NAME?: string;
    MAX_LENGTH?: string;
    COMMENTS?: string;
    COLUMN_DEFAULT?: string;
    IS_PRIMARYKEY?: string;
    IS_NOTNULL?: string;
}

export interface ComCodeInfoModel {
    COM_CODE?: string;
    DBNAME?: string;
    ConnectionId?: string;
}

export interface IDIssueInfo {
    TB_NAME?: string;
    ID_ISSUE?: string;
    COM_CODE?: string;
    DBNAME?: string;
    ConnectionId?: string;
    IO_DATE?: string;
    IO_NO?: string;
}

export interface NtsInfo {
    NTS_ID?: string;
    RECEIPT_ID?: string;
    ID_ISSUE?: string;
    ConnectionId?: string;
    ZONE?: string;
    COM_CODE?: string;
    ID_VAL?: string;
}
export interface WINSERVICEAPP_INFO {
    SERVICE_CD: number;
    SERVICE_NAME: string;
    SERVICE_FOLDER: string;
    BASE_SERVICE_PATH: string;
    SERVICE_PATH: string;
    SERVICEAPP_TYPE: 'WinSchedule' | 'WinService' | 'DownloadServer' | 'Process';
    MEMO: string;
    WRITE_ID: string;
    WRITE_DT: string;
    USE_YN: boolean;
    SCHEDULE_XML_NAME: string;
    SOLUTION_ID: string;
    ONLY_FILE: boolean | null;
    DEFAULT_SYNC_YN: string;
    VERSION: number;
    BUCKET_NAME: string;
}

export interface GetDBListResponseDto {
    DB_TYPE?: DatabaseProvider;
    DB_NAME?: string;
}

export interface GetTableListRequestDto {
    ConnectionId?: string;
    DBNAME?: string;
    NAME?: string;
    CONTAIN_ECBACK?: string;
    DbType?: DatabaseProvider;
    COLTXT?: string;
    TABLE_COMMENT?: string;
    COLUMN_COMMENT?: string;
}

export interface GetColumnInfoRequestDto {
    ConnectionId?: string;
    DBNAME?: string;
    NAME?: string;
    DbType?: DatabaseProvider;
    IsCheckPrimaryKey?: boolean;
}
export interface SqlTextDto {
    ServerGroup?: string;
    Zone?: string;
    ConnectionId?: string;
    DbName?: string;
    Query?: string;
    LogKey?: string;
    UserId?: string;
}

export interface DBCopyDto {
    SERVER_GROUP?: string;
    ZONE?: string;
    DBSource?: string;
    FromDbTable?: string;
    ToDbTable?: string;
    FileNm?: string;
    JobCd?: string;
    UseECBack?: boolean;
    LogKey?: string;
    DevId?: string;
    UserId?: string;
}

export interface MigrationResultModel {
    ResultMessage: string;
    Succeed: boolean;
}

export type ENUM_DATACOPY_WHERE_QUERY_VALUE_TYPE = 'S' | 'M' | 'Q';
export interface WhereQueryInfoModel {
    ColumnName: string;
    ValueType: ENUM_DATACOPY_WHERE_QUERY_VALUE_TYPE;
    Value: string;
}
export interface TableCopyModel {
    FromTable?: TableInfoModel;
    ToTable?: TableInfoModel;
    ColumnsQuery?: string;
    SelectQuery?: string;
    WhereQueryInfo?: WhereQueryInfoModel[];
    IsTruncateTable?: boolean;
    Extended?: any;
}
export interface MigrationTableCopyRequestModel extends TableCopyModel {
    LogKey?: string;
    UserId?: string;
    FileNm?: string;
    JobCd?: string;
    DevId?: string;
}

export interface GetProcedureTextDto {
    ConnectionId?: string;
    ConnectionDbName?: string;
    SpName?: string;
    DbType?: DatabaseType;
    SpType?: string;
}

export interface SP_EXECUTE_HISTORY {
    JOB_CD?: string;
    SERVER_GROUP?: string;
    SERVER_ZONE?: string;
    FILE_NM?: string;
    HISTORY_NO?: number;
    HISTORY_TYPE?: 'APPLY' | 'EXECUTE';
    CONTENTS?: string;
    WRITE_DT?: string;
    WRITE_ID?: string;
    NEW_CONTENTS?: string;
}

export interface IsExistSpRequestDto {
    ConnectionId?: string;
    DbName?: string;
    DbType?: DatabaseType;
    SpName?: string;
}
export interface GetVirtualPartitionInfoRequestDto {
    ServerGroup?: string;
    Zone?: string;
}

export interface GetVirtualPartitionInfoResponseDto {
    Tables?: string;
    Comcodes?: string;
}

export interface GetPrgIDConnInfoRequestDto {
    ServerGroup?: string;
    Zone?: string;
}
export interface SqlTextDto {
    ServerGroup?: string;
    Zone?: string;
    ConnectionId?: string;
    DbName?: string;
    Query?: string;
    LogKey?: string;
    UserId?: string;
}

export interface DBCopyDto {
    SERVER_GROUP?: string;
    ZONE?: string;
    DBSource?: string;
    FromDbTable?: string;
    ToDbTable?: string;
    FileNm?: string;
    JobCd?: string;
    UseECBack?: boolean;
    LogKey?: string;
    DevId?: string;
    UserId?: string;
}

export interface MigrationResultModel {
    ResultMessage: string;
    Succeed: boolean;
}

export interface WhereQueryInfoModel {
    ColumnName: string;
    ValueType: ENUM_DATACOPY_WHERE_QUERY_VALUE_TYPE;
    Value: string;
}
export interface TableCopyModel {
    FromTable?: TableInfoModel;
    ToTable?: TableInfoModel;
    ColumnsQuery?: string;
    SelectQuery?: string;
    WhereQueryInfo?: WhereQueryInfoModel[];
    IsTruncateTable?: boolean;
    Extended?: any;
}
export interface MigrationTableCopyRequestModel extends TableCopyModel {
    LogKey?: string;
    UserId?: string;
    FileNm?: string;
    JobCd?: string;
    DevId?: string;
}

export interface GetProcedureTextDto {
    ConnectionId?: string;
    ConnectionDbName?: string;
    SpName?: string;
    DbType?: DatabaseType;
    SpType?: string;
}

export interface SP_EXECUTE_HISTORY {
    JOB_CD?: string;
    SERVER_GROUP?: string;
    SERVER_ZONE?: string;
    FILE_NM?: string;
    HISTORY_NO?: number;
    HISTORY_TYPE?: 'APPLY' | 'EXECUTE';
    CONTENTS?: string;
    WRITE_DT?: string;
    WRITE_ID?: string;
    NEW_CONTENTS?: string;
}

export interface IsExistSpRequestDto {
    ConnectionId?: string;
    DbName?: string;
    DbType?: DatabaseType;
    SpName?: string;
}
export interface GetVirtualPartitionInfoRequestDto {
    ServerGroup?: string;
    Zone?: string;
}

export interface GetVirtualPartitionInfoResponseDto {
    Tables?: string;
    Comcodes?: string;
}

export interface GetPrgIDConnInfoRequestDto {
    ServerGroup?: string;
    Zone?: string;
}

export interface GetServiceInstallListRequestDto {
    OBJECT_SID?: string;
    SERVICE_CD?: number;
    SERVICE_NAME?: string;
    SERVICE_FOLDER?: string;
    MEMO?: string;
    USER_YN?: boolean;
    SERVER_NM?: string;
    SERVER_GROUP?: string;
}

export interface GetServiceInstallListResponseDto {
    OBJECTT_SID?: string;
    SERVICE_CD?: number;
    SERVICE_NAME?: string;
    OBJECT_NM?: string;
    SERVER_IP?: string;
    SERVICEAPP_TYPE?: string;
    SERVICE_FOLDER?: string;
    MEMO?: string;
    VERSION?: number;
}
