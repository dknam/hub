import { isEquals } from '../string';

export function includes(source: string[], searchStr: string, isIgnoreCase: boolean = true) {
    return source.some((x) => isEquals(x, searchStr, isIgnoreCase));
}

export function toMap<T, U, O>(source: T[], keySelector: (item: T) => U, valueSelector: (item: T) => O) {
    const map = new Map<U, O>();
    source.forEach((item) => {
        const key = keySelector(item);
        const value = valueSelector(item);
        map.set(key, value);
    });
    return map;
}
