import { Str } from '@ecdh/util';
import { databaseApp } from '../api/databaseApp';
import { upload } from '../api/serverApi';
import { PrgIdConnInfo, ServerData, ecountSeparator } from '../data_model';
import { OS } from '../enum';
import * as _ from 'lodash';
import { ICacheFileService } from './types';
import { uploadToServer } from './util';
import { ServerModel } from '../data_model/serverModel';

export const cacheFileService = ((): ICacheFileService => {
    const createPgPartitionFileContent = async (server: ServerModel) => {
        let tables = '';
        let comcodes = '';
        await Promise.all(
            server.zoneList.map(async (zone) => {
                const info = await databaseApp.sendPost('GetVirtualPartitionInfo', {
                    ServerGroup: server.serverGroup,
                    Zone: zone,
                });

                tables = [tables, info.Tables].join(ecountSeparator);
                comcodes = [comcodes, info.Comcodes].join(ecountSeparator);
            })
        );

        const partitionInfo = {
            Tables: _.uniq(Str.split(tables, ecountSeparator)).join(ecountSeparator),
            comcodes: _.uniq(Str.split(comcodes, ecountSeparator)).join(ecountSeparator),
        };
        return JSON.stringify(partitionInfo);
    };

    const createPrgIdConnInfoFileContent = async (server: ServerModel, zone: string) => {
        const infos = await databaseApp.sendPost('GetPrgIdConnInfo', { ServerGroup: server.serverGroup, Zone: zone });
        if (!infos) {
            return null;
        }

        if (server.os === 'window') {
            return JSON.stringify(infos);
        }

        let map = new Map<string, PrgIdConnInfo>();
        _.uniq(infos)
            .filter((info) => info.prg_id)
            .forEach((info) => {
                map.set(info.prg_id!, info);

                if (info.menu_sid && !map.has(info.menu_sid)) {
                    map.set(info.menu_sid, info);
                }

                const bizzId = info.bizz_sid;
                const slicedBizzId = bizzId?.substring(-7, bizzId.length); // ex) B_000000E072000 -> E072000
                if (info.prg_id === slicedBizzId && bizzId && !map.has(bizzId)) {
                    map.set(bizzId, info);
                }
            });

        return JSON.stringify(map);
    };

    const createUserIdPkTableFileContent = (server: ServerModel) => {
        return Promise.resolve('');
    };

    const uploadPgPartitionFile = async (server: ServerModel, userID: string) => {
        const fileContent = await createPgPartitionFileContent(server);
        const filePath = getPgPartitionFilePath(server.os?.toLowerCase() === 'linux' ? OS.LINUX : OS.WINDOWS);
        uploadToServer(server, fileContent, filePath, userID);
        // log upload
    };

    const uploadPrgIdConnInfoFile = async (server: ServerModel, userID: string, isV5: boolean = false) => {
        const fileInfos = await Promise.all(
            server.zoneList.map(async (zone) => ({
                filePath: getPrgIdConnInfoPath(server.os?.toLowerCase() === 'linux' ? OS.LINUX : OS.WINDOWS, zone),
                fileContent: await createPrgIdConnInfoFileContent(server, zone),
            }))
        );

        fileInfos
            .filter((info) => info.fileContent)
            .forEach((info) => {
                uploadToServer(server, info.fileContent!, info.filePath, userID);
                // log insert
            });
    };

    const uploadUserIdPkTableFile = async (server: ServerModel, userID: string) => {};

    const getPrgIdConnInfoPath = (serverOS: OS, zone: string) => {
        if (serverOS === OS.LINUX) {
            return `ecountv5/vshared/app_data/esql/info_prgid_menu_sid_${zone}.json`;
        }
        return `WebService\\PrgIdConnInfo_${zone}.txt`;
    };

    const getPgPartitionFilePath = (serverOS: OS) => {
        if (serverOS === OS.LINUX) {
            return `ecountv5/vshared/app_data/esql/info_pg_virtual_partition.def`;
        }
        return `WebService\\PgVirtualPartitionTable.txt`;
    };

    const getUserIdPkTableFilePath = (serverOS: OS, zone: string) => `WebService\\UserIdPkTable_${zone}.txt`;

    return {
        createPgPartitionFileContent,
        createPrgIdConnInfoFileContent,
        createUserIdPkTableFileContent,
        uploadPgPartitionFile,
        uploadPrgIdConnInfoFile,
        uploadUserIdPkTableFile,
        getPgPartitionFilePath,
        getPrgIdConnInfoPath,
        getUserIdPkTableFilePath,
    };
})();
