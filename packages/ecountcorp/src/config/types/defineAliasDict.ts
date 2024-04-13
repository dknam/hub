import { Arr, Str } from '@ecdh/util';
import { ServerModel } from '../../data_model/serverModel';
import { StringBuilder } from '../../data_model/stringBuilder';

export const defineAliasDict = new Map<string, (server: ServerModel) => string>([
    [
        'appconf:zone:list',
        (server) => {
            const sb = new StringBuilder();
            const zoneObjects = server.Relations.filter(
                (x) => Str.isEquals(x.objectM.OBJECT_TYPE, 'zone') && !Str.isEquals(x.objectM.OBJECT_NM, 'Z')
            );
            zoneObjects.forEach((zone) => {
                sb.appendLine(
                    `\t<add key=\"${zone.Attr.get('comInfo')}\" value=\"appconf_${zone.objectM.OBJECT_NM}.config\" />`
                );
            });

            return sb.release();
        },
    ],
    [
        'connection:zone:list',
        (server) => {
            const sb = new StringBuilder();
            const zoneObjects = server.Relations.filter(
                (x) => Str.isEquals(x.objectM.OBJECT_TYPE, 'zone') && !Str.isEquals(x.objectM.OBJECT_NM, 'Z')
            );
            zoneObjects.forEach((zone) => {
                sb.appendLine(
                    `\t\t<add key=\"${zone.Attr.get('comInfo')}\" value=\"connection_${zone.objectM.OBJECT_NM}.config\" />`
                );
            });

            return sb.release();
        },
    ],
    [
        'extendedTargets',
        (server) => {
            return server.Relations.filter((x) => Str.isEquals(x.objectM.OBJECT_TYPE, 'zone'))
                .map((x) => x.objectM.OBJECT_NM)
                .join(',');
        },
    ],
    [
        'exapi:subDomain',
        (server) => {
            if (Str.isEquals(server.serverGroup, 'center')) {
                return 'exapi';
            } else if (Arr.includes(['stage', 'apollo90', 'apollo91', 'apollo92'], server.serverGroup)) {
                return 'stexapi';
            } else if (Str.isEquals(server.serverGroup, 'hera')) {
                return 'hexapi';
            } else {
                return 'zexapi';
            }
        },
    ],
    [
        'ecount:domain',
        (server) => {
            return Str.isEquals(server.mainZone, 'F') ? 'ecount.cn' : 'ecount.com';
        },
    ],
    [
        'ecounterp:domain',
        (server) => {
            return Str.isEquals(server.mainZone, 'F') ? 'ecounterp.cn' : 'ecounterp.com';
        },
    ],
    [
        'ecount:hostname',
        (server) => {
            const arg1 = Str.isEquals(server.serverGroup, 'center') ? 'login' : server.serverGroup.toLowerCase();
            const arg2 = Str.isEquals(server.mainZone, 'F') ? '.ecount.cn' : '.ecount.com';
            return `${arg1}${arg2}`;
        },
    ],
    [
        'ecounterp:hostname',
        (server) => {
            const arg1 = Str.isEquals(server.serverGroup, 'center') ? 'login' : server.serverGroup.toLowerCase();
            const arg2 = Str.isEquals(server.mainZone, 'F') ? '.ecounterp.cn' : '.ecounterp.com';
            return `${arg1}${arg2}`;
        },
    ],
    [
        'ecount:login:subDomain',
        (server) => {
            const subDomain = Str.isEquals(server.serverGroup, 'center') ? 'login' : server.serverGroup.toLowerCase();
            return subDomain;
        },
    ],
    [
        'ecount:login:subDomainZone',
        (server) => {
            const subDomain = Str.isEquals(server.serverGroup, 'center') ? 'login' : server.serverGroup.toLowerCase();
            return `${subDomain}${server.mainZone}`;
        },
    ],
]);
