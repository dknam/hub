import { DatabaseType, DbObjectType, TableCopyContentsModel, ZoneAndGmcType } from './types';
import { Str } from '@ecdh/util';
import { databaseApp } from '../api/databaseApp';
import { MigrationTableCopyRequestModel } from '../api/types';
import { TableInfoModel } from './tableInfoModel';
import { DatabaseInfoModel } from './databaseInfoModel';
import { DbObjectModel } from './dbObjectModel';

// export function getGmcConnectionId(serverGroup: string, dbType: DatabaseType, gmcDbName: string) {
//     let dest: string;

//     if (dbType === 'MsSql') {
//         dest = 'E';
//     } else if (dbType === 'MySql' || dbType === 'MyHbSql') {
//         dest = gmcDbName;
//     } else {
//         throw Error('this database is not supported.');
//     }

//     return format(connectionIdFormat, dbType.toLocaleLowerCase(), serverGroup, dest);
// }
// export function getConnectionId(serverGroup: string, dbType: DatabaseType, zone: string) {
//     return format(connectionIdFormat, dbType.toLocaleLowerCase(), serverGroup, zone);
// }

// export function getConnectionDbName(dbName: string, dbType: DatabaseType) {
//     if (dbType === 'MsSql') {
//         return dbName;
//     } else if (dbType === 'MySql' || dbType === 'MyHbSql') {
//         return convertGmcDbName(dbName);
//     } else if (dbType === 'PgSql') {
//         return 'ecount';
//     }
//     throw Error('알 수 없는 데이터베이스 입니다.');
// }

// export function convertGmcDbName(dbName: string) {
//     if (GmcDbConvertMap.has(dbName)) {
//         return GmcDbConvertMap.get(dbName)!;
//     }
//     return dbName;
// }
export function extractDbNameForMs(migContent: string) {
    const regexp = new RegExp(/^use\s+[\`\[]?(?<db>\w+)[\`\]]?;?/gim);
    const execArr = regexp.exec(migContent);
    if (execArr) {
        return execArr.groups?.['db'];
    } else {
        throw Error('USE문을 찾을 수 없습니다.');
    }
}
export function exceptDelimiterStmtForMaria(migContent: string) {
    return migContent.replaceAll(/(DELIMITER\s+)([$|;]+)/gim, '$1;');
}
export function extractRestoreQuery(migContent: string) {
    const startMarker = '!!!restore_start';
    const endMarker = '!!!restore_end';
    const startIndex = Str.indexOf(migContent, startMarker);
    const endIndex = Str.indexOf(migContent, endMarker);

    if (startIndex === -1 || endIndex === -1) {
        throw Error('복원 쿼리를 찾지 못했습니다.');
    }

    return migContent.substring(startIndex + startMarker.length, endIndex);
}
export function removeUseGoStmt(migContent: string) {
    return migContent.replaceAll(/(^(\s+)?use\s.+$)|(^(\s+)?go(\s+)?$)/gim, '');
}
export function appendGrantStmtForPg(query: string) {
    const sb = [query];
    const matches = query.matchAll(/create\s+table\s+(if\s+not\s+exists\s+)?(?<TableName>[^\s\(]+)(\s+as)?/g);
    for (const match of matches) {
        const tableName = match.groups?.['TableName']!;
        sb.push(`alter table ${tableName} owner to r_own;`);
        sb.push(`grant select on ${tableName} to r_sel;`);
        sb.push(`grant select, update, delete, insert on ${tableName} to r_dml;`);
    }
    return sb.join(`\n`);
}
export function makeExecutableQuery(
    zone: string,
    migContent: string,
    dbType: DatabaseType,
    userId: string,
    isRestore: boolean,
    developer: string,
    jobCd: string,
    fileName: string,
    logKey?: string
) {
    let result = migContent;
    let res = '';
    const sb = [];

    if (isRestore) {
        result = extractRestoreQuery(migContent);
        res = 'Restore ';
    }

    if (dbType === 'MsSql') {
        result = result.replaceAll(/--MAXDOP/gi, ` OPTION (MAXDOP 2) `);
        sb.push('SET CONTEXT_INFO 0x1999; ');
        sb.push(
            `EXEC ACCT.dbo.ESP_MIGLOG_INSERT @DEV_ID = '\${DEVID}', @JOB_CODE = '\${JOBCD}', @FILE_NM = '\${FILENM}', @TYPEVALUE = 'T', @REMARKS = '${res}Started by ${userId}', @RCNT = 0`
        );
        sb.push(result);
        sb.push(
            `EXEC ACCT.dbo.ESP_MIGLOG_INSERT @DEV_ID = '\${DEVID}', @JOB_CODE = '\${JOBCD}', @FILE_NM = '\${FILENM}', @TYPEVALUE = 'T', @REMARKS = '${res}End by ${userId}', @RCNT = 0`
        );
        sb.push(`SET CONTEXT_INFO 0x; `);
    } else if (dbType === 'MySql' || dbType === 'MyHbSql') {
        sb.push(`SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;`);
        sb.push(
            `CALL EC_COMMON.ESP_MIGLOG_INSERT('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'T','${res}Started by ${userId}', 0);`
        );
        sb.push(removeUseGoStmt(result));
        sb.push(
            `CALL EC_COMMON.ESP_MIGLOG_INSERT('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'T','${res}End by ${userId}', 0);`
        );
    } else if (dbType === 'PgSql') {
        sb.push(
            `CALL ec_common.esp_miglog_insert('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'T','${res}Started by ${userId}', 0);`
        );
        sb.push(appendGrantStmtForPg(removeUseGoStmt(result)));
        sb.push(
            `CALL ec_common.esp_miglog_insert('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'T','${res}End by ${userId}', 0);`
        );
    }
    return sb
        .join(`\n`)
        .replaceAll('${DEVID}', developer)
        .replaceAll('${JOBCD}', `${logKey}∬${jobCd}`)
        .replaceAll('${FILENM}', fileName)
        .replaceAll('${DEPLOY_ZONE}', zone);
}

export function executeMig(
    serverGroup: string,
    zone: ZoneAndGmcType,
    migContent: string,
    dbType: DatabaseType,
    userId: string,
    isRestore: boolean,
    developer: string,
    jobCd: string,
    fileName: string,
    logKey: string,
    dbName: string
) {
    const query = makeExecutableQuery(zone, migContent, dbType, userId, isRestore, developer, jobCd, fileName, logKey);
    const dbModel = new DatabaseInfoModel(serverGroup, dbType, zone, dbName);
    databaseApp.sendPost('ExecuteSqlText', {
        ConnectionId: dbModel.connectionId,
        DbName: dbModel.useDatabaseName,
        Query: query,
        LogKey: logKey,
        ServerGroup: serverGroup,
        UserId: userId,
        Zone: zone,
    });
}

export async function executeDbCopy(
    serverGroup: string,
    zone: string,
    query: string,
    userId: string,
    developer: string,
    jobCd: string,
    fileName: string,
    logKey: string
) {
    const fileData = Str.split(query, `\n`);

    if (fileData.length !== 3) {
        throw Error('파일 포맷이 일치하지 않습니다.');
    }

    const dbSource = fileData[0].replace('DB=', '').trim();
    const fromDbTable = fileData[1].replace('SOURCE=', '').trim();
    const toDbTable = fileData[2].replace('TARGET=', '').trim();
    const result = await databaseApp.sendPost('ExecuteTableCopy', {
        SERVER_GROUP: serverGroup,
        ZONE: zone,
        DBSource: dbSource,
        FromDbTable: fromDbTable,
        ToDbTable: toDbTable,
        UserId: userId,
        FileNm: fileName,
        JobCd: jobCd,
        UseECBack: false,
        LogKey: logKey,
        DevId: developer,
    });
    result.ResultMessage = `Zone : ${zone}\n${result.ResultMessage}`;
    return result;
}

export function makeTableCopyModel(
    serverGroup: string,
    zone: ZoneAndGmcType,
    fileContent: string,
    developer: string,
    jobCd: string,
    fileName: string,
    userId: string,
    logKey: string
) {
    const fileData = JSON.parse(fileContent) as TableCopyContentsModel;

    const fromDbType = fileData.DB_TYPE.SOURCE as DatabaseType;
    const fromZone = (fileData.ZONE.SOURCE as ZoneAndGmcType) || zone;
    const fromDbName = Str.split(fileData.TABLE.SOURCE, '.').shift()!;
    const fromTableName = Str.split(fileData.TABLE.SOURCE, '.').pop()!;

    const toDbType = fileData.DB_TYPE.TARGET as DatabaseType;
    const toZone = (fileData.ZONE.TARGET as ZoneAndGmcType) || zone;
    const toDbName = Str.split(fileData.TABLE.TARGET, '.').shift()!;
    const toTableName = Str.split(fileData.TABLE.TARGET, '.').pop()!;

    const result: MigrationTableCopyRequestModel = {
        FromTable: new TableInfoModel(serverGroup, fromDbType, fromZone, fromTableName, fromDbName),
        ToTable: new TableInfoModel(serverGroup, toDbType, toZone, toTableName, toDbName),
        DevId: developer,
        LogKey: logKey,
        JobCd: jobCd,
        FileNm: fileName,
        UserId: userId,
        IsTruncateTable: true,
    };
    return result;
}
export async function executeMigrationTableCopy(
    serverGroup: string,
    zone: ZoneAndGmcType,
    fileContent: string,
    developer: string,
    jobCd: string,
    fileName: string,
    userId: string,
    logKey: string
) {
    const model = makeTableCopyModel(serverGroup, zone, fileContent, developer, jobCd, fileName, userId, logKey);
    return await databaseApp.sendPost('ExecuteMigrationTableCopy', model);
}

export async function executeSp(
    serverGroup: string,
    zone: ZoneAndGmcType,
    databaseType: DatabaseType,
    databaseName: string,
    spName: string,
    spType: DbObjectType,
    fileName: string,
    fileContent: string,
    jobCd: string,
    isNol4: boolean,
    executeType: 'CREATE' | 'DELETE',
    userId: string,
    logKey: string
) {
    let query = '';
    const spModel = new DbObjectModel(serverGroup, databaseType, zone, spName, spType, databaseName);
    const spNameWhetherNol4 = `${spName}${isNol4 ? '_NOL4' : ''}`;
    let oldContent = '';

    // to-do: sp 유무 확인 후 GetProcedureText 호출하도록 수정
    try {
        oldContent = await databaseApp.sendPost('GetProcedureText', {
            ConnectionId: spModel.connectionId,
            ConnectionDbName: spModel.useDatabaseName,
            DbType: databaseType,
            SpName: spNameWhetherNol4,
            SpType: spType,
        });
    } catch {}

    if (executeType === 'CREATE') {
        query = spModel.makeCreateQuery(fileContent);
    } else {
        query = spModel.makeDeleteQuery();
    }

    await databaseApp.sendPost('ExecuteSqlText', {
        ConnectionId: spModel.connectionId,
        DbName: spModel.databaseName,
        Query: query,
        ServerGroup: serverGroup,
        UserId: userId,
        Zone: zone,
        LogKey: logKey,
    });
    await databaseApp.sendPost('InsertSpExecuteHistory', {
        CONTENTS: oldContent,
        FILE_NM: fileName,
        HISTORY_TYPE: 'EXECUTE',
        JOB_CD: jobCd,
        NEW_CONTENTS: query,
        SERVER_GROUP: serverGroup,
        SERVER_ZONE: zone,
        WRITE_ID: userId,
    });
}
export async function applySp(
    serverGroup: string,
    zone: ZoneAndGmcType,
    databaseType: DatabaseType,
    databaseName: string,
    spName: string,
    spType: DbObjectType,
    fileName: string,
    jobCd: string,
    userId: string,
    logKey: string
) {
    const spNol4Name = spName + '_NOL4';
    const spModel = new DbObjectModel(serverGroup, databaseType, zone, spName, spType, databaseName);
    const doesNol4Exist = await databaseApp.sendPost('IsExistSp', {
        ConnectionId: spModel.connectionId,
        DbName: spModel.databaseName,
        DbType: databaseType,
        SpName: spNol4Name,
    });

    if (!doesNol4Exist) {
        throw Error(`${spNol4Name} 존재하지 않습니다.`);
    }

    const doesExist = await databaseApp.sendPost('IsExistSp', {
        ConnectionId: spModel.connectionId,
        DbName: spModel.databaseName,
        DbType: databaseType,
        SpName: spName,
    });
    const nol4Content = await databaseApp.sendPost('GetProcedureText', {
        ConnectionId: spModel.connectionId,
        ConnectionDbName: spModel.databaseName,
        DbType: databaseType,
        SpName: spNol4Name,
        SpType: spType,
    });
    const applyContent = spModel.makeCreateQuery(nol4Content);
    let oldContent = '';

    if (doesExist) {
        oldContent = await databaseApp.sendPost('GetProcedureText', {
            ConnectionId: spModel.connectionId,
            ConnectionDbName: spModel.databaseName,
            DbType: databaseType,
            SpName: spName,
            SpType: spType,
        });
    }

    await databaseApp.sendPost('ExecuteSqlText', {
        ConnectionId: spModel.connectionId,
        DbName: spModel.databaseName,
        Query: applyContent,
        ServerGroup: serverGroup,
        UserId: userId,
        Zone: zone,
        LogKey: logKey,
    });

    await databaseApp.sendPost('InsertSpExecuteHistory', {
        CONTENTS: oldContent,
        NEW_CONTENTS: applyContent,
        FILE_NM: fileName,
        HISTORY_TYPE: 'APPLY',
        JOB_CD: jobCd,
        SERVER_GROUP: serverGroup,
        SERVER_ZONE: zone,
        WRITE_ID: userId,
    });
}

export function exceptDropStmt(content: string, objectType: DbObjectType, objectName: string) {
    const exp = `DROP\s+${objectType}\s+(IF\s+EXISTS\s+)?\`?${objectName}\`?;`;
    const regex = new RegExp(exp, 'gim');
    return content.replaceAll(regex, '');
}
