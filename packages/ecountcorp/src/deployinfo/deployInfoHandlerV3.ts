import { DeployInfoHandlerBase } from './deployInfoHandlerBase';
import { DeployInfoModel, SSDBEntityCacheV3 } from './types';
import * as xpath from 'xpath';
import * as dom from '@xmldom/xmldom';
import { js2xml } from 'xml-js';
import _, { isNumber, isString } from 'lodash';
import { ecountSeparator } from '../data_model';
import { Str } from '@ecdh/util';

export class DeployInfoHandlerV3 extends DeployInfoHandlerBase {
    filePath: string = 'd:/webservice/deployinfo.xml';
    parse(content: string): DeployInfoModel {
        const xmlDoc = new dom.DOMParser().parseFromString(content);
        const enableNol4 = xpath.select1('string(//ROOT/SERVER/VALUE)', xmlDoc);
        const enablePgSql = xpath.select1('string(//ROOT/PGSQL/ENABLE)', xmlDoc);
        const enableLocalDb = xpath.select1('string(//ROOT/LOCALDB/ENABLE)', xmlDoc);
        const enableV5Flag = xpath.select1('string(//ROOT/V5_FLAG/ENABLE)', xmlDoc);
        const enablePgCommonBal = xpath.select1('string(//ROOT/PGCOMMONBAL/ENABLE)', xmlDoc);
        const activeSSDB = xpath.select1('string(//ROOT/SSDB/ACTIVE)', xmlDoc);
        const enableSSDB = xpath.select1('string(//ROOT/SSDB/ENABLE)', xmlDoc);
        const enableApm = xpath.select1('string(//ROOT/APM_USE)', xmlDoc);
        const alertCnt = xpath.select1('string(//ROOT/ALERT_CNT)', xmlDoc);
        const nol4SpList = xpath.select1('string(//ROOT/SQL/VALUE)', xmlDoc);
        const closeTime = xpath.select1('string(//ROOT/CLOSETIME/VALUE)', xmlDoc);
        const refreshTimeStamp = xpath.select1('number(//ROOT/REFRESH_TIMESTAMP/VALUE)', xmlDoc);
        const closePageList = this.array2Object('string(//ROOT/CLOSE_PAGE)', xmlDoc);
        const closeFormTypeList = this.array2Object('string(//ROOT/CLOSE_FORMTYPE)', xmlDoc);
        const closePermissionList = this.array2Object('string(//ROOT/CLOSE_PERMISSION)', xmlDoc);
        const closeTemplateList = this.array2Object('string(//ROOT/CLOSE_TEMPLATE)', xmlDoc);
        const tableSchemaCacheVersion = xpath.select1('string(//ROOT/TableSchema/CacheVersion)', xmlDoc);
        const v5Version = xpath.select1('string(//ROOT/VERSION/V5)', xmlDoc);
        const menuVersion = xpath.select1('string(//ROOT/VERSION/MENU)', xmlDoc);
        const disabledShard = xpath.select1('string(//ROOT/SHARD_SETTING/DisabledShard)', xmlDoc);
        const pgsqlFlagList = this.node2Object('//ROOT/PGSQL_ENABLE', xmlDoc);
        const localDbFlagList = this.node2Object('//ROOT/LOCALDB_ENABLE', xmlDoc);
        const v5FlagList = this.node2Object('//ROOT/V5_FLAG_ENABLE', xmlDoc);
        const pgCommonBalFlagList = this.node2Object('//ROOT/PGCOMMONBAL_ENABLE', xmlDoc);
        const etcFlagList = this.node2Object('//ROOT/ETC_FLAG_ENABLE', xmlDoc);
        const ssdbFlagListNode = xpath.select1('//ROOT/SSDB_ENABLE', xmlDoc) as Node;
        // const disableCategories: string[] = [];
        // const disableTargets: string[] = [];
        // const nol4Targets: string[] = [];
        // ssdbFlagListNode.childNodes.forEach((child) => {
        //     child.childNodes.forEach((enableOrValueNode) => {
        //         if (enableOrValueNode.nodeName === 'ENABLE') {
        //             if (enableOrValueNode.nodeValue === 'Y') {
        //                 disableCategories.push(child.nodeName);
        //             }
        //         } else if (enableOrValueNode.nodeName === 'VALUE') {
        //             const value = enableOrValueNode.nodeValue?.split(ecountSeparator) ?? [];
        //             value.forEach((el) => {
        //                 if (el.search(/`\w+=N`/gi) === -1) {
        //                     disableTargets.push(el);
        //                 } else {
        //                     nol4Targets.push(el);
        //                 }
        //             });
        //         }
        //     });
        // });
        const ssdbFlagObj: DeployInfoModel['SSDB']['EntityCache'] = {};
        Array.from(ssdbFlagListNode.childNodes).forEach((child) => {
            if (child.nodeName === '#text') return;

            let disableCategory: boolean = false;
            let disableTargets: string[] = [];
            let nol4Targets: string[] = [];

            Array.from(child.childNodes).forEach((enableOrValueNode) => {
                if (enableOrValueNode.nodeName === '#text') return;

                if (enableOrValueNode.nodeName === 'ENABLE') {
                    disableCategory = enableOrValueNode.childNodes[0].nodeValue === 'Y' ? false : true;
                } else if (enableOrValueNode.nodeName === 'VALUE') {
                    if (enableOrValueNode.childNodes.length) {
                        const value = Str.split(enableOrValueNode.childNodes[0].nodeValue!, ecountSeparator) ?? [];
                        value.forEach((el) => {
                            if (el.search(/\w+=N/gi) !== -1) {
                                disableTargets.push(el);
                            } else {
                                nol4Targets.push(el);
                            }
                        });
                    }
                }
            });

            ssdbFlagObj[child.nodeName] = {
                DisableCategory: disableCategory,
                DisableTargets: disableTargets.join(ecountSeparator),
                Nol4Targets: nol4Targets.join(ecountSeparator),
            };
        });

        let model: DeployInfoModel = {
            EnableNol4: enableNol4 === 'Y' ? true : false,
            EnableAPM: enableApm === 'Y' ? true : false,
            StoredProcedures: isString(nol4SpList) ? nol4SpList : '',
            PGSQL: {
                Enabled: enablePgSql === 'Y' ? true : false,
                Features: pgsqlFlagList,
            },
            LOCALDB: {
                Enabled: enableLocalDb === 'Y' ? true : false,
                Features: localDbFlagList,
            },
            PGCOMMONBAL: {
                Enabled: enablePgCommonBal === 'Y' ? true : false,
                Features: pgCommonBalFlagList,
            },
            ETC_FLAG: {
                Features: etcFlagList,
            },
            V5_FLAG: {
                Enabled: enableV5Flag === 'Y' ? true : false,
                Features: v5FlagList,
            },
            RefreshTimeStamp: isNumber(refreshTimeStamp) ? refreshTimeStamp : Date.now() * 10000,
            SSDB: {
                Active: activeSSDB === 'Y' ? true : false,
                Enabled: enableSSDB === 'Y' ? true : false,
                EntityCache: ssdbFlagObj,
                // EntityCache: {
                //     DisableCategories: disableCategories.join(ecountSeparator),
                //     DisableTargets: disableTargets.join(ecountSeparator),
                //     Nol4Targets: nol4Targets.join(ecountSeparator),
                // },
            },
            CLOSE_FORMTYPE: {
                Features: closeFormTypeList,
            },
            CLOSE_PAGE: {
                Features: closePageList,
            },
            CLOSE_PERMISSION: {
                Features: closePermissionList,
            },
            CLOSE_TEMPLATE: {
                Features: closeTemplateList,
            },
            ALERT_CNT: alertCnt === 'Y' ? true : false,
            TableSchema: {
                CacheVersion: isString(tableSchemaCacheVersion) ? tableSchemaCacheVersion : '',
            },
            V5_VERSION: {
                V5: isString(v5Version) ? v5Version : '',
            },
            MENU_VERSION: {
                MENU: isString(menuVersion) ? menuVersion : '',
            },
            ShardSetting: {
                DisabledShard: isString(disabledShard) ? disabledShard : '',
            },
            CLOSETIME: isString(closeTime) ? closeTime : '',
        };

        return model;
    }
    toString(model: DeployInfoModel): string {
        const obj = {
            ROOT: {
                SERVER: {
                    VALUE: model.EnableNol4 ? 'Y' : 'N',
                },
                SQL: {
                    VALUE: model.StoredProcedures,
                },
                USE: {
                    VALUE: 'Y',
                },
                PGSQL: {
                    ENABLE: model.PGSQL.Enabled ? 'Y' : 'N',
                },
                PGSQL_ENABLE: model.PGSQL.Features,
                LOCALDB: {
                    ENABLE: model.LOCALDB.Enabled ? 'Y' : 'N',
                },
                LOCALDB_ENABLE: model.LOCALDB.Features,
                V5_FLAG: {
                    ENABLE: model.V5_FLAG.Enabled ? 'Y' : 'N',
                },
                V5_FLAG_ENABLE: model.V5_FLAG.Features,
                PGCOMMONBAL: {
                    ENABLE: model.PGCOMMONBAL.Enabled ? 'Y' : 'N',
                },
                PGCOMMONBAL_ENABLE: model.PGCOMMONBAL.Features,
                ETC_FLAG_ENABLE: model.ETC_FLAG.Features,
                CLOSETIME: {
                    VALUE: model.CLOSETIME,
                },
                REFRESH_TIMESTAMP: {
                    VALUE: model.RefreshTimeStamp,
                },
                SSDB: {
                    ACTIVE: model.SSDB.Active,
                    ENABLE: model.SSDB.Enabled,
                },
                SSDB_ENABLE: this.convertToSSDBFlagObject(model.SSDB.EntityCache as SSDBEntityCacheV3),
                CLOSE_PAGE: Object.keys(model.CLOSE_PAGE.Features).join(ecountSeparator),
                CLOSE_FORMTYPE: Object.keys(model.CLOSE_FORMTYPE.Features).join(ecountSeparator),
                CLOSE_PERMISSION: Object.keys(model.CLOSE_PERMISSION.Features).join(ecountSeparator),
                CLOSE_TEMPLATE: Object.keys(model.CLOSE_TEMPLATE.Features).join(ecountSeparator),
                APM_USE: model.EnableAPM ? 'Y' : 'N',
                ALERT_CNT: model.ALERT_CNT ? 'Y' : 'N',
                TableSchema: model.TableSchema,
                VERSION: {
                    V5: model.V5_VERSION.V5,
                    MENU: model.MENU_VERSION.MENU,
                },
                SHARD_SETTING: model.ShardSetting,
            },
        };

        return js2xml(this.convertBooleanToString(obj), { compact: true, spaces: 4 });
    }

    private node2Object(xmlPath: string, xmlDoc: Document) {
        const obj: { [key: string]: boolean } = {};
        const node = xpath.select1(xmlPath, xmlDoc) as Node;

        Array.from(node.childNodes).forEach((child) => {
            if (child.nodeName === '#text') return;
            obj[child.nodeName] = child.childNodes[0].nodeValue === 'Y' ? true : false;
        });
        return obj;
    }
    private array2Object(xmlPath: string, xmlDoc: Document) {
        const obj: { [key: string]: true } = {};
        const value = xpath.select1(xmlPath, xmlDoc);

        if (isString(value)) {
            Str.split(value, ecountSeparator).forEach((el) => {
                obj[el] = true;
            });
        }

        return obj;
    }
    private convertToSSDBFlagObject(ssdbFeatures: SSDBEntityCacheV3) {
        const obj: { [key: string]: { ENABLE: string; VALUE: string } } = {};

        for (const key in ssdbFeatures) {
            const disableTargets = Str.split(ssdbFeatures[key].DisableTargets, ecountSeparator).map((el) => `${el}=N`);
            const nol4Targets = Str.split(ssdbFeatures[key].DisableTargets, ecountSeparator);
            obj[key] = {
                ENABLE: ssdbFeatures[key].DisableCategory ? 'N' : 'Y',
                VALUE: disableTargets.concat(nol4Targets).join(ecountSeparator),
            };
        }
        return obj;
    }
    private convertBooleanToString(obj: any) {
        const result: any = {};

        for (const key in obj) {
            if (typeof obj[key] === 'boolean') {
                result[key] = obj[key] ? 'Y' : 'N';
            } else if (typeof obj[key] === 'object') {
                result[key] = this.convertBooleanToString(obj[key]);
            } else {
                result[key] = obj[key];
            }
        }
        return result;
    }
}
