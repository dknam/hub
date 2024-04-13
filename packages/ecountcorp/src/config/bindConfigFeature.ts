import { Arr, Str } from '@ecdh/util';
import { ObjectModel } from '../data_model/objectModel';
import { ServerModel } from '../data_model/serverModel';
import {
    attrOnlyRegExp,
    attrRegExp,
    defineAliasDict,
    defineRegExp,
    groupOnlyRegExp,
    groupRegExp,
    listRegExp,
    roleOptionRegExp,
    roleRegExp,
    zoneRegExp,
} from './types';
import { serverApp } from '../api/serverApp';
import { ObjectServerResultModel } from '../api/types';

export class BindConfigFeature {
    private objectList: ObjectModel[];
    private serverList: ServerModel[];

    private attrDict: Map<string, ObjectServerResultModel[]> = new Map();

    constructor(objectList: ObjectModel[], serverList: ServerModel[]) {
        this.objectList = objectList;
        this.serverList = serverList;
    }

    public attrOnlyValue(configValue: string, deployZone: string, server: ServerModel) {
        let attrValue: string | undefined;
        let matchValue: string | undefined;

        if ((matchValue = this.findNamedCapturingGroup(attrOnlyRegExp, configValue, 'attr_id'))) {
            if ((attrValue = server.Attr.get(matchValue))) {
                return attrValue;
            }

            const zoneList = server.Relations.filter((x) => Str.isEquals(x.objectM.OBJECT_TYPE, 'zone'));

            // 서버에 연결된 Zone 정보가 없는 경우는 pass
            if (zoneList.length) {
                const zone = zoneList.find((x) => Str.isEquals(x.objectM.OBJECT_NM, deployZone));

                if (zone) {
                    if ((attrValue = zone.Attr.get(matchValue))) {
                        return attrValue;
                    }
                }

                const group = server.Relations.find((x) => Str.isEquals(x.objectM.OBJECT_TYPE, 'server_group'));
                if ((attrValue = group?.Attr.get(matchValue))) {
                    return attrValue;
                }
            }
        }
    }

    public roleValue(configValue: string, deployZone: string, server: ServerModel) {
        let attrValue: string | undefined;
        let [zoneValue, roleValue, attrMatchValue, optionValue]: string | undefined[] = [];

        if ((zoneValue = this.findNamedCapturingGroup(zoneRegExp, configValue, 'zone'))) {
            deployZone = zoneValue;
        }

        if ((roleValue = this.findNamedCapturingGroup(roleRegExp, configValue, 'role'))) {
            if ((attrMatchValue = this.findNamedCapturingGroup(attrRegExp, configValue, 'attr_id'))) {
                optionValue = this.findNamedCapturingGroup(roleOptionRegExp, configValue, 'option');
                const zoneTarget = this.serverList.find(
                    (x) =>
                        Str.isEquals(x.serverGroup, server.serverGroup) &&
                        x.Relations.some(
                            (r) =>
                                Str.isEquals(r.objectM.OBJECT_TYPE, 'role') &&
                                Str.isEquals(r.objectM.OBJECT_NM, roleValue)
                        ) &&
                        x.hasZone &&
                        Arr.includes(x.zoneList, deployZone)
                );
                if ((attrValue = zoneTarget?.Attr.get(attrMatchValue))) {
                    return attrValue;
                }

                if (optionValue === '1') return;

                const gmcTarget = this.serverList.find(
                    (x) =>
                        Str.isEquals(x.serverGroup, server.serverGroup) &&
                        x.Relations.some(
                            (r) =>
                                Str.isEquals(r.objectM.OBJECT_TYPE, 'role') &&
                                Str.isEquals(r.objectM.OBJECT_NM, roleValue)
                        ) &&
                        !x.hasZone
                );
                if ((attrValue = gmcTarget?.Attr.get(attrMatchValue))) {
                    return attrValue;
                }

                if (optionValue === '2') {
                    return;
                }

                const target = this.serverList.find(
                    (x) =>
                        Str.isEquals(x.serverGroup, server.serverGroup) &&
                        x.Relations.some(
                            (r) =>
                                Str.isEquals(r.objectM.OBJECT_TYPE, 'role') &&
                                Str.isEquals(r.objectM.OBJECT_NM, roleValue)
                        )
                );
                if ((attrValue = target?.Attr.get(attrMatchValue))) {
                    return attrValue;
                }
            }
        }
    }

    public zoneValue(configValue: string, deployZone: string, server: ServerModel) {
        let attrValue: string | undefined;
        let [zoneValue, attrMatchValue]: string | undefined[] = [];

        if ((zoneValue = this.findNamedCapturingGroup(zoneRegExp, configValue, 'zone'))) {
            const target = server.Relations.find(
                (x) => Str.isEquals(x.objectM.OBJECT_TYPE, 'zone') && Str.isEquals(x.objectM.OBJECT_NM, zoneValue)
            );

            if (!target) {
                return;
            }

            if ((attrMatchValue = this.findNamedCapturingGroup(attrRegExp, configValue, 'attr_id'))) {
                if ((attrValue = target.Attr.get(attrMatchValue))) {
                    return attrValue;
                }
            }
        }
    }
    public async groupOnlyValue(configValue: string, deployZone: string, server: ServerModel) {
        if (groupOnlyRegExp.test(configValue)) {
            let attrList: ObjectServerResultModel[] | undefined;
            const serverGroup = this.findNamedCapturingGroup(groupOnlyRegExp, configValue, 'server_group')!;

            if (!(attrList = this.attrDict.get(serverGroup))) {
                attrList = await serverApp.sendPost('GetListObjectFromAttrId', {
                    ATTR_ID: this.findNamedCapturingGroup(groupOnlyRegExp, configValue, 'attr_id')!,
                });
                this.attrDict.set(serverGroup, attrList);
            }
            const target = attrList.find(
                (x) => Str.isEquals(x.OBJECT_TYPE, 'server_group') && Str.isEquals(x.OBJECT_NM, serverGroup)
            );
            if (target) {
                return target.ATTR_VALUE;
            }
        }
    }
    public defineValue(configValue: string, deployZone: string, server: ServerModel) {
        let matchValue: string | undefined;

        if ((matchValue = this.findNamedCapturingGroup(defineRegExp, configValue, 'attr_id'))) {
            if (Str.isEquals(matchValue, 'zone')) {
                return server.configMainZone;
            }

            let defineAliasFunc: ((server: ServerModel) => string) | undefined;
            const define = server.Relations.find((x) => Str.isEquals(x.objectM.OBJECT_TYPE, matchValue));

            if (define) {
                return define.objectM.OBJECT_NM;
            } else if ((defineAliasFunc = defineAliasDict.get(matchValue))) {
                return defineAliasFunc(server);
            }
        }
    }
    // public listValue(configValue: string, deployZone: string, server: ServerModel) {
    //     if (!this.findNamedCapturingGroup(listRegExp, configValue, 'list_type')) {
    //         return;
    //     }

    //     serverApp.sendPost('GetListListTypeR', {})
    // }

    public findNamedCapturingGroup(regExp: RegExp, input: string, groupName: string) {
        const m = regExp.exec(input);
        if (m) {
            return m.groups?.[groupName]!;
        }
    }
}
