import { Str } from '@ecdh/util';
import _, { includes } from 'lodash';
import { ecountSeparator } from './consts';
import { ObjectModel } from './objectModel';
import { SERVER_M } from '.';

export class ServerModel extends ObjectModel {
    public get serverM(): SERVER_M {
        return {
            SERVER_IP: this.serverIp,
            SERVER_GROUP: this.serverGroup,
            OS: this.os,
            SERVER_NM: this.serverName,
            ZONES: this.zones,
        };
    }
    public get SERVER_SID() {
        return this.objectM.Key.OBJECT_SID;
    }
    public get serverName() {
        return this.objectM.OBJECT_NM;
    }
    public get serverGroupModel() {
        const result = this.Relations.find((el) => Str.isEquals(el.objectM.OBJECT_TYPE, 'server_group'));
        if (!result) {
            throw Error('서버 그룹 모델을 찾을 수 없습니다.');
        }
        return result;
    }
    public get serverGroup() {
        return this.serverGroupModel.objectM.OBJECT_NM;
    }
    public get roleList() {
        return this.Relations.filter((el) => el.objectM.OBJECT_TYPE === 'role').map((el) => el.objectM.OBJECT_NM);
    }
    public get ROLES() {
        return this.roleList.join(ecountSeparator);
    }
    public get os() {
        return this.Attr.get('server:ip');
    }
    public get serverIp() {
        return this.Attr.get('server:ip');
    }
    public get mainZone() {
        return this.zoneList.includes('Z')
            ? 'Z'
            : this.zoneList.includes('BA')
              ? 'BA'
              : this.zoneList.includes('E')
                ? 'E'
                : this.zoneList[0];
    }
    public get zoneList() {
        return this.Relations.filter((el) => el.objectM.OBJECT_TYPE === 'zone').map((el) => el.objectM.OBJECT_NM);
    }
    public get zones() {
        return this.zoneList.join(ecountSeparator);
    }
    public get configMainZone() {
        return (
            _.orderBy(this.zoneList, (el) => (Str.isEquals(el, 'BA') ? 1 : Str.isEquals(el, 'E') ? 2 : 3)).shift() ?? ''
        );
    }
    public get hasZone() {
        return this.zoneList.length > 0;
    }
    public get isLxLogin78() {
        return ['7CIB1UU2GFO2MV9', '7CIB1V28TCU2MVB'].includes(this.objectM.Key.OBJECT_SID);
    }
}
