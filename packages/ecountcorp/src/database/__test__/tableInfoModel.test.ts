import dayjs from 'dayjs';
import { TableInfoModel } from '../tableInfoModel';

describe('tableInfoModel', () => {
    it('mssql test', () => {
        const tableModel = new TableInfoModel('ZEUS00', 'MsSql', 'BA', 'ACC001', 'ACCT');
        expect(tableModel.backupDatabaseTableName).toEqual(`ACCT.dbo.ACC001_${dayjs().format('YYYYMMDD')}_ECBACK`);
        expect(tableModel.backupTableName).toEqual(`ACC001_${dayjs().format('YYYYMMDD')}_ECBACK`);
        expect(tableModel.databaseTableName).toEqual(`ACCT.dbo.ACC001`);
    });

    it('pgsql test', () => {
        const tableModel = new TableInfoModel('ZEUS00', 'PgSql', 'BA', 'ACC009', 'BASE');
        expect(tableModel.backupDatabaseTableName).toEqual(
            `temp.ACC009_${dayjs().format('YYYYMMDD')}_ECBACK`.toLowerCase()
        );
        expect(tableModel.backupTableName).toEqual(`ACC009_${dayjs().format('YYYYMMDD')}_ECBACK`.toLowerCase());
        expect(tableModel.databaseTableName).toEqual(`base.acc009`.toLowerCase());
    });
});
