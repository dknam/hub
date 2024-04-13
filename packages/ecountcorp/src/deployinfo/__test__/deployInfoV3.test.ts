import * as xpath from 'xpath';
import * as dom from '@xmldom/xmldom';
import { Str } from '@ecdh/util';
import { DeployInfoHandlerV3, DeployInfoHandlerV5 } from '..';

describe('deployInfo v3', () => {
    it('module: xmlpath test', async () => {
        const value = '202403290742192076';
        const xmlString = `
        <ROOT>
            <TableSchema><CacheVersion>${value}</CacheVersion></TableSchema>
        </ROOT>`;
        const xmlDoc = new dom.DOMParser().parseFromString(xmlString);
        const tableSchemaCacheVersion = xpath.select1('string(//ROOT/TableSchema/CacheVersion)', xmlDoc);
        expect(tableSchemaCacheVersion).toEqual(value);
    });
    it('read test', async () => {
        const handler = new DeployInfoHandlerV3();
        const fileString = await handler.read({
            SERVER_IP: '10.10.9.99',
        });
        expect(Str.includes(fileString, 'ROOT')).toBeTruthy();
    });

    it('parse, toString Test', async () => {
        const handler = new DeployInfoHandlerV3();
        const fileString = await handler.read({
            SERVER_IP: '10.10.9.99',
        });
        const model1 = handler.parse(fileString);
        const toString1 = handler.toString(model1);
        const model2 = handler.parse(toString1);
        const toString2 = handler.toString(model2);
        expect(toString1).toEqual(toString2);
    });
});
