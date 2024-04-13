import {
    appendGrantStmtForPg,
    exceptDelimiterStmtForMaria as exceptDelimiterStmtForMariaSp,
    extractDbNameForMs,
    extractRestoreQuery,
    makeExecutableQuery,
    makeTableCopyModel,
    removeUseGoStmt,
} from '../util';
import { migQueryMs, migQueryMy, migQueryPg, spQueryMs, spQueryMy } from './testConsts';

describe('util#1', () => {
    it('extractDbName test', () => {
        const database = extractDbNameForMs(migQueryMs);
        expect(database).toEqual('ACCT');
    });
    it('exceptDelimiterStmt test', () => {
        const data = exceptDelimiterStmtForMariaSp(spQueryMy);
        expect(data).toContain('DELIMITER ;');
        expect(data).not.toContain('DELIMITER $$');
    });
    it('extractRestoreQuery test', () => {
        const data = extractRestoreQuery(migQueryMs);
        expect(data.toLowerCase()).not.toContain('!!!restore_start');
    });
    it('removeUseGoStmt test', () => {
        const data = removeUseGoStmt(migQueryMs);
        expect(data.toLowerCase()).not.toContain('use ');
    });
    it('appendGrantStmtForPg test', () => {
        const data = appendGrantStmtForPg(migQueryPg);
        expect(data).toContain('to r_own');
        expect(data).toContain('to r_sel');
        expect(data).toContain('to r_dml');
    });
    it('makeExecutableQuery test', () => {
        const data = makeExecutableQuery(
            'BA',
            migQueryMs,
            'MsSql',
            'testUser',
            false,
            'testDeveloper',
            'testJobCd',
            'testFileName'
        );
        expect(data).not.toContain('--MAXDOP');
        expect(data).toContain('OPTION (MAXDOP 2)');
        expect(data).toContain('ESP_MIGLOG_INSERT');
    });
});
