import { PrgIdConnInfo } from '../data_model';
import ContractBase from './contractBase';
import {
    ECColumnInfo,
    ComCodeInfoModel,
    IDIssueInfo,
    NtsInfo,
    ECTableInfo,
    WinServiceAppInfo,
    GetColumnInfoRequestDto,
    GetDBListResponseDto,
    GetTableListRequestDto,
    DatabaseInfoModel,
    SqlTextDto,
    DBCopyDto,
    MigrationResultModel,
    MigrationTableCopyRequestModel,
    GetProcedureTextDto,
    SP_EXECUTE_HISTORY,
    IsExistSpRequestDto,
    GetVirtualPartitionInfoRequestDto,
    GetVirtualPartitionInfoResponseDto,
    GetPrgIDConnInfoRequestDto,
    GetServiceInstallListRequestDto,
    GetServiceInstallListResponseDto,
} from './types';

class DatabaseApp extends ContractBase {
    constructor() {
        super('ECount.Deploy.DatabaseApp', 'ECount.Deploy.DatabaseApp.DatabaseAppFeatures');
    }

    async sendPost(
        funcName: 'SelectServiceAppInstallList',
        body: GetServiceInstallListRequestDto
    ): Promise<GetServiceInstallListResponseDto[]>;
    async sendPost(funcName: 'GetPrgIdConnInfo', body: GetPrgIDConnInfoRequestDto): Promise<PrgIdConnInfo[]>;
    async sendPost(
        funcName: 'GetVirtualPartitionInfo',
        body: GetVirtualPartitionInfoRequestDto
    ): Promise<GetVirtualPartitionInfoResponseDto>;
    async sendPost(funcName: 'InsertNtsIdInfos', body: NtsInfo): Promise<boolean>;
    async sendPost(funcName: 'GetIDIssueInfos', body: IDIssueInfo): Promise<IDIssueInfo[]>;
    async sendPost(funcName: 'GetComcodeInfos', body: ComCodeInfoModel): Promise<ComCodeInfoModel>;
    async sendPost(funcName: 'SelectWinServiceAppInfo', body: WinServiceAppInfo): Promise<Array<WinServiceAppInfo>>;
    async sendPost(funcName: 'GetListDatabase', body: DatabaseInfoModel): Promise<Array<GetDBListResponseDto>>;
    async sendPost(funName: 'GetTables', body: GetTableListRequestDto): Promise<Array<ECTableInfo>>;
    async sendPost(funcName: 'GetColumnInfos', body: GetColumnInfoRequestDto): Promise<Array<ECColumnInfo>>;
    async sendPost(funcName: 'ExecuteSqlText', body: SqlTextDto): Promise<boolean>;
    async sendPost(funcName: 'ExecuteTableCopy', body: DBCopyDto): Promise<MigrationResultModel>;
    async sendPost(
        funcName: 'ExecuteMigrationTableCopy',
        body: MigrationTableCopyRequestModel
    ): Promise<MigrationResultModel>;
    async sendPost(funcName: 'GetProcedureText', body: GetProcedureTextDto): Promise<string>;
    async sendPost(funcName: 'InsertSpExecuteHistory', body: SP_EXECUTE_HISTORY): Promise<boolean>;
    async sendPost(funcName: 'IsExistSp', body: IsExistSpRequestDto): Promise<boolean>;
    async sendPost<TRequest, TResult>(funcName: string, body: TRequest): Promise<TResult> {
        var response = this.post<TRequest, TResult>(funcName, body);
        return response;
    }
}

export const databaseApp = new DatabaseApp();
