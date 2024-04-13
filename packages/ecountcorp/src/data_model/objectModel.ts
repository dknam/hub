import { PG_OBJECT_ATTR } from './pgObjectAttr';
import { PG_OBJECT_M, PG_OBJECT_M_Key } from './pgObjectM';

export class ObjectModel {
    public objectM: PG_OBJECT_M;
    public Relations: ObjectModel[];
    public Attributes: PG_OBJECT_ATTR[];

    constructor(objectM: PG_OBJECT_M, relations: ObjectModel[], attributes: PG_OBJECT_ATTR[]) {
        this.objectM = objectM;
        this.Relations = relations;
        this.Attributes = attributes;
    }

    public get Attr() {
        const map = new Map<string, string>();
        this.Attributes.forEach((el) => {
            map.set(el.Key.ATTR_ID, el.ATTR_VALUE);
        });
        return map;
    }
}
