import { DatabaseInfoModel } from './databaseInfoModel';
import { DatabaseType, DbObjectType, ZoneAndGmcType } from './types';

export class DbObjectModel extends DatabaseInfoModel {
    public objectName: string;
    public objectType: DbObjectType;

    constructor(
        serverGroup: string,
        databaseType: DatabaseType,
        zone: ZoneAndGmcType,
        objectName: string,
        objectType: DbObjectType,
        databaseName?: string,
        shardNo?: number
    ) {
        super(serverGroup, databaseType, zone, databaseName, shardNo);
        this.objectName = objectName;
        this.objectType = objectType;
    }

    public get databaseDbObjectName() {
        if (this.DatabaseType === 'MsSql') {
            return `${this.databaseName}.dbo.${this.objectName}`;
        } else if (this.DatabaseType === 'PgSql') {
            return `${this.databaseName}.${this.objectName}`.toLowerCase();
        } else {
            return `${this.databaseName}.${this.objectName}`;
        }
    }

    public makeDeleteQuery(): string {
        return `DROP ${this.objectType} IF EXISTS ${this.databaseDbObjectName};`;
    }
    public makeCreateQuery(content: string) {
        if (this.isMsSql) {
            return content.replaceAll(
                /(?<CrudName>alter|create)\s+(?<Type>procedure|proc|function|view|trigger)\s+(\[?DBO\]?\.)?\[?(?<Name>[\w\d]+)(_NOL4)?\]?/gim,
                `CREATE OR ALTER $2 $4$5`
            );
        } else if (this.isMariaDb) {
            return content.replaceAll(
                /(?<CrudName>alter|create(\s+or\s+replace)?)\s+((?<Algorithm>ALGORITHM=\w+)\s+)?(?<Definer>DEFINER=`\w+`@`%`)\s+(?<Type>procedure|function|func|view|trigger)\s+`?(?<Name>[\w\d]+)(_NOL4)?`?/gim,
                `DROP $6 IF EXISTS $7$8;
                CREATE $4 $5 $6 $7$8`
            );
        } else {
            return content.replaceAll(
                /(?<CrudName>create(\s+or\s+replace)?)\s+(?<Type>procedure|function|view|trigger)\s+(?<Name>[\w\d\.]+)(_NOL4)?/gim,
                `DROP $3 IF EXISTS $4$5;
                CREATE OR REPLACE $3 $4%5`
            );
        }
    }
}
