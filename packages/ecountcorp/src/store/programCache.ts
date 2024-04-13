import { serverApp } from '../api/serverApp';
import { ObjectModel } from '../data_model/objectModel';
import { PG_OBJECT_RELATION } from '../data_model/pgObjectRelation';
import { ServerModel } from '../data_model/serverModel';
import { MemoryStoreImple } from './storeImpl';
import { IStore } from './type';
import * as _ from 'lodash';

class ProgramCache {
    constructor(private store: IStore) {}

    public get relationList() {
        return this.store.getOrAdd<PG_OBJECT_RELATION[]>('relationList', async () => {
            return await serverApp.sendPost('GetListObjectRelation', {});
        });
    }

    public get objectList() {
        return this.store.getOrAdd<ObjectModel[]>('objectList', () => {
            // const objectList = await serverApp.sendPost('GetListObject', {})
            // const relationList = await this.relationList;
            // const relationGroup = _.groupBy(relationList, (r) => r.Key?.OBJECT_SID)
            // objectList.map(obj => {
            //   const relations = _.find(relationGroup, (group) => group[0].Key?.OBJECT_SID === obj.Key.OBJECT_SID) ?? []
            //   new ObjectModel(obj, relations, obj.Attributes)
            // })

            return [];
        });
    }

    public get allServerList() {
        return this.store.getOrAdd<ServerModel[]>('allServerList', () => []);
    }
}

export const programCache = new ProgramCache(new MemoryStoreImple());
