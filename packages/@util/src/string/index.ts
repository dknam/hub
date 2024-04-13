import { format as utilFormat } from 'util';

/**
 * ignoreCase string 비교
 * @param a
 * @param b
 * @param isIgnoreCase
 * @returns
 */
export function isEquals(a: string | undefined, b: string | undefined, isIgnoreCase: boolean = true) {
    if (!a || !b) {
        return false;
    }

    if (isIgnoreCase) {
        return a.toLowerCase() === b.toLowerCase();
    } else {
        return a === b;
    }
}

/**
 * String.includes + ignoreCase
 * @param source
 * @param searchStr
 * @param isIgnoreCase
 * @returns
 */
export function includes(source: string | undefined, searchStr: string | undefined, isIgnoreCase: boolean = true) {
    if (!source || !searchStr) {
        return false;
    }

    if (isIgnoreCase) {
        return source.toLowerCase().includes(searchStr.toLowerCase());
    } else {
        return source.includes(searchStr);
    }
}

/**
 * String.endsWith + ignoreCase 기능 추가
 * @param source
 * @param target
 * @param endPosition
 * @param isIgnoreCase
 * @returns
 */
export function endsWith(
    source: string | undefined,
    target: string | undefined,
    endPosition?: number | undefined,
    isIgnoreCase: boolean = true
) {
    if (!source || !target) {
        return false;
    }

    if (isIgnoreCase) {
        return source.toLowerCase().endsWith(target.toLowerCase(), endPosition);
    } else {
        return source.endsWith(target, endPosition);
    }
}

/**
 * String.split() + 빈 항목은 제거
 * @param source
 * @param seperator
 * @returns
 */
export function split(source: string | undefined, seperator: string | RegExp) {
    if (source) {
        return source.split(seperator).filter(Boolean);
    }
    return [];
}

/**
 * util.format + undefined인 항목 ''으로 치환하여 동작
 * @param format
 * @param args
 */
export function format(format: string, ...args: (any | undefined)[]) {
    return utilFormat(format, ...args.map((el) => el ?? ''));
}

export function indexOf(source: string, searchString: string, isIgnoreCase: boolean = true) {
    if (isIgnoreCase) {
        return source.toLowerCase().indexOf(searchString.toLowerCase());
    } else {
        return source.indexOf(searchString);
    }
}

export function base64urlEncode(source: string) {
    return btoa(source).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
