import dayjs from 'dayjs';
import { ECColumnInfo } from '../api/types';
import { DatabaseInfoModel } from './databaseInfoModel';
import { DatabaseType, ZoneAndGmcType } from './types';

export class TableInfoModel extends DatabaseInfoModel {
    public TableName: string;
    public Columns?: ECColumnInfo[];

    constructor(
        serverGroup: string,
        databaseType: DatabaseType,
        zone: ZoneAndGmcType,
        tableName: string,
        databaseName?: string,
        shardNo?: number,
        columns?: ECColumnInfo[]
    ) {
        super(serverGroup, databaseType, zone, databaseName, shardNo);
        this.TableName = tableName;
        this.Columns = columns;
    }

    public get columnQuery() {
        return this.Columns?.map((el) => el.NAME).join(', ');
    }

    public get databaseTableName() {
        if (this.DatabaseType === 'MsSql') {
            return `${this.databaseName}.dbo.${this.TableName}`;
        } else if (this.DatabaseType === 'PgSql') {
            return `${this.databaseName}.${this.TableName}`.toLowerCase();
        } else {
            return `${this.databaseName}.${this.TableName}`;
        }
    }

    public get backupTableName() {
        const result = `${this.TableName}_${dayjs().format('YYYYMMDD')}_ECBACK`;
        return this.isPgSql ? result.toLowerCase() : result;
    }
    public get backupDatabaseTableName() {
        const result = `${this.tempDatabaseName}${this.isMsSql ? '.dbo' : ''}.${this.backupTableName}`;
        return this.isPgSql ? result.toLowerCase() : result;
    }
    public get backupQueryFormat() {
        if (this.isMsSql) {
            return `SELECT * INTO %s FROM ${this.databaseTableName} WITH(NOLOCK) %s`;
        } else if (this.isPgSql) {
            return `SELECT * INTO ${this.tempDatabaseName}.%s FROM ${this.databaseTableName} %s`;
        } else {
            return `CREATE TABLE %s SELECT * FROM ${this.databaseTableName} %s`;
        }
    }
    public get deleteQueryFormat() {
        if (this.isMsSql) {
            return `
            SET CONTEXT_INFO 0x1999;
            
            IF EXISTS (SELECT * FROM sys.tables where name = '${this.TableName}')
            BEGIN
                WHILE 1 = 1
                BEGIN
                    DELETE TOP (5000) FROM ${this.databaseTableName}
                    %s
            
                    IF @@ROWCOUNT < 5000
                        BREAK;
                    WAITFOR DELAY '00:00:00.002';
                END
            END
            
            SET CONTEXT_INFO 0x;
            `;
        } else {
            return `DELETE FROM ${this.databaseTableName} %s`;
        }
    }
}
