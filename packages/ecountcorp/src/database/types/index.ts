export type DatabaseType = 'MsSql' | 'MySql' | 'MyHbSql' | 'PgSql';
export const FreqZones = ['BA', 'BB', 'BC', 'E'];
export const WeeklyZones = ['AA', 'AB', 'AC', 'CA', 'CB', 'CC', 'CD', 'F', 'IA'];
export const AllZones = FreqZones.concat(WeeklyZones);
export type ZoneAndGmcType =
    | 'AA'
    | 'AB'
    | 'AC'
    | 'BA'
    | 'BB'
    | 'BC'
    | 'CA'
    | 'CB'
    | 'CC'
    | 'CD'
    | 'E'
    | 'F'
    | 'IA'
    | 'GMC';
export const FreqZoneGroups = FreqZones.map((el) => el[0]);
export const WeeklyZoneGroups = WeeklyZones.map((el) => el[0]);
export const AllZoneGroups = AllZones.map((el) => el[0]);
export const GmcDbConvertMap = new Map([
    ['ECOUNT_ACCT', 'Ecount_Acct'],
    ['GWBOARD', 'EC_GW'],
    ['BUSINESS', 'ECOUNT'],
    ['SENDMAIL', 'SEND_MAIL'],
    ['ECSMS', 'EC_SMS'],
    ['SYS_MANAGER', 'sys_manager'],
    ['SETUP', 'setup'],
]);
export const connectionIdFormat = '%s:%s_%s%s';

export interface TableCopyContentsModel {
    ZONE: FromToModel;
    DB_TYPE: FromToModel;
    TABLE: FromToModel;
}

export interface FromToModel {
    SOURCE?: string;
    TARGET: string;
}
export type DbObjectType = 'PROCEDURE' | 'TRIGGER' | 'FUNCTION' | 'VIEW';
