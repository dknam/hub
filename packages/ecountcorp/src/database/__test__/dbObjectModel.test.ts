import { DbObjectModel } from '../dbObjectModel';
import { spQueryMs, spQueryMy, spQueryPg } from './testConsts';

describe('dbObjectModel', () => {
    beforeEach(() => {});
    it('mssql sp test', () => {
        const model = new DbObjectModel(
            'ZEUS00',
            'MsSql',
            'BA',
            'ESP_CLOSING_INSERT_MNG001_AMT_V3',
            'PROCEDURE',
            'ACCT'
        );
        const createQuery = model.makeCreateQuery(spQueryMs);
        const deleteQuery = model.makeDeleteQuery();
        expect(createQuery).toContain('CREATE OR ALTER PROCEDURE ESP_CLOSING_INSERT_MNG001_AMT_V3');
        expect(deleteQuery).toEqual(`DROP PROCEDURE IF EXISTS ACCT.dbo.ESP_CLOSING_INSERT_MNG001_AMT_V3;`);
    });
    it('mysql sp test', () => {
        const model = new DbObjectModel(
            'ZEUS00',
            'MySql',
            'BA',
            'ESP_CMCD_COMPANY_CREATE_JOB_INSERT',
            'PROCEDURE',
            'EC_COFS'
        );
        const createQuery = model.makeCreateQuery(spQueryMy);
        const deleteQuery = model.makeDeleteQuery();
        expect(createQuery).toContain(`DROP PROCEDURE IF EXISTS ESP_CMCD_COMPANY_CREATE_JOB_INSERT;`);
        expect(createQuery).toContain('CREATE  DEFINER=`ecount0001`@`%` PROCEDURE ESP_CMCD_COMPANY_CREATE_JOB_INSERT');
        expect(deleteQuery).toEqual(`DROP PROCEDURE IF EXISTS EC_COFS.ESP_CMCD_COMPANY_CREATE_JOB_INSERT;`);
    });
    it('pgsql sp test', () => {
        const model = new DbObjectModel('ZEUS00', 'PgSql', 'BA', 'fn_sum_unity_byday_force', 'FUNCTION', 'bizz');
        const createQuery = model.makeCreateQuery(spQueryPg);
        const deleteQuery = model.makeDeleteQuery();
        expect(createQuery).toContain(`DROP FUNCTION IF EXISTS bizz.fn_sum_unity_byday_force;`);
        expect(createQuery).toContain('CREATE OR REPLACE FUNCTION bizz.fn_sum_unity_byday_force');
        expect(deleteQuery).toEqual(`DROP FUNCTION IF EXISTS bizz.fn_sum_unity_byday_force;`);
    });
});
