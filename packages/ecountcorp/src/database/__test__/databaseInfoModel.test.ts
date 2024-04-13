import { DatabaseInfoModel } from '../databaseInfoModel';

describe('databaseInfoModel', () => {
    it('mssql test', () => {
        const dbModel = new DatabaseInfoModel('ZEUS00', 'MsSql', 'BA', 'ACCT');
        expect(dbModel.connectionId).toEqual('mssql:ZEUS00_BA');
        expect(dbModel.databaseName).toEqual('ACCT');
        expect(dbModel.isGmc).toEqual(false);
        expect(dbModel.tempDatabaseName).toEqual('ACCT');
        expect(dbModel.useDatabaseName).toEqual('ACCT');
    });

    it('mssql test2', () => {
        const dbModel = new DatabaseInfoModel('ZEUS00', 'MsSql', 'BA');
        expect(dbModel.connectionId).toEqual('mssql:ZEUS00_BA');
        expect(dbModel.databaseName).toEqual('ACCT');
        expect(dbModel.isGmc).toEqual(false);
        expect(dbModel.tempDatabaseName).toEqual('ACCT');
        expect(dbModel.useDatabaseName).toEqual('ACCT');
    });

    it('mysql Test1', () => {
        const dbModel = new DatabaseInfoModel('ZEUS00', 'MySql', 'GMC');
        expect(dbModel.isMariaDb).toEqual(true);
        expect(() => dbModel.databaseName).toThrow(Error);
    });

    it('mysql Test2', () => {
        const dbModel = new DatabaseInfoModel('ZEUS00', 'MySql', 'GMC', 'SETUP');
        expect(dbModel.databaseName).toEqual('SETUP');
        expect(dbModel.useDatabaseName).toEqual('setup');
    });
    it('pgsql Test1', () => {
        const dbModel = new DatabaseInfoModel('ZEUS00', 'PgSql', 'BA', 'bizz');
        expect(dbModel.databaseName).toEqual('bizz');
        expect(dbModel.tempDatabaseName).toEqual('temp');
        expect(dbModel.useDatabaseName).toEqual('ecount');
    });
});
