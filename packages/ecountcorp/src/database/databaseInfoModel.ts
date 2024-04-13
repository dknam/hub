import { Str } from '@ecdh/util';
import { DatabaseType, GmcDbConvertMap, ZoneAndGmcType, connectionIdFormat } from './types';

export class DatabaseInfoModel {
    private _defaultDatabase = new Map<DatabaseType, string>([
        ['MsSql', 'ACCT'],
        ['MySql', 'EC_COMMON'],
        ['MyHbSql', 'EC_COMMON'],
        ['PgSql', 'ecount'],
    ]);

    public ServerGroup: string;
    public DatabaseType: DatabaseType;
    public Zone: ZoneAndGmcType;
    public ShardNo?: number;

    constructor(
        serverGroup: string,
        databaseType: DatabaseType,
        zone: ZoneAndGmcType,
        databaseName?: string,
        shardNo?: number
    ) {
        this.ServerGroup = serverGroup;
        this.DatabaseType = databaseType;
        this.Zone = zone;
        this.databaseName = databaseName;
        this.ShardNo = shardNo;
    }

    public get isGmc(): boolean {
        return this.Zone === 'GMC';
    }

    protected _databaseName?: string;
    public get databaseName(): string {
        if (this._databaseName) {
            return this._databaseName;
        }

        throw Error('데이터베이스 명을 찾을 수 없습니다.');
    }
    public set databaseName(value: string | undefined) {
        this._databaseName = value;
    }

    public get defaultDatabaseName() {
        if (this.isGmc) {
            const gmcDefault = GmcDbConvertMap.values().next().value;
            if (gmcDefault) {
                return gmcDefault;
            }
        } else {
            if (this._defaultDatabase.has(this.DatabaseType)) {
                return this._defaultDatabase.get(this.DatabaseType)!;
            }
        }
        throw Error('defaultDatabaseName을 찾을 수 없습니다.');
    }

    public get useDatabaseName(): string {
        if (this.isGmc) {
            return GmcDbConvertMap.get(this.databaseName) ?? this.databaseName;
        } else if (this.isPgSql) {
            return 'ecount';
        } else {
            return this.databaseName;
        }
    }
    public get tempDatabaseName(): string {
        if (this.DatabaseType === 'PgSql') {
            return 'temp';
        }
        return this.databaseName;
    }

    private _connectionId?: string;
    public get connectionId(): string {
        if (this._connectionId) {
            return this._connectionId;
        }

        if (this.isGmc) {
            if (this.DatabaseType === 'MySql' || this.DatabaseType === 'MyHbSql') {
                return Str.format(
                    connectionIdFormat,
                    this.DatabaseType.toLocaleLowerCase(),
                    this.ServerGroup,
                    this.databaseName,
                    this.ShardNo
                );
            } else {
                throw Error('this database is not supported.');
            }
        } else {
            return Str.format(
                connectionIdFormat,
                this.DatabaseType.toLocaleLowerCase(),
                this.ServerGroup,
                this.Zone,
                this.ShardNo
            );
        }
    }

    public get isMsSql(): boolean {
        return this.DatabaseType === 'MsSql';
    }
    public get isMySql(): boolean {
        return this.DatabaseType === 'MySql';
    }
    public get isMyHbSql(): boolean {
        return this.DatabaseType === 'MyHbSql';
    }
    public get isMariaDb(): boolean {
        return this.DatabaseType === 'MySql' || this.DatabaseType === 'MyHbSql';
    }
    public get isPgSql(): boolean {
        return this.DatabaseType === 'PgSql';
    }
}
