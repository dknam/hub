import { Arr, Str } from '@ecdh/util';
import {
    ConfigModel,
    DeployConfigRequestModel,
    ResolveFilter,
    argGroupRegExp,
    argIndexRegExp,
    attrOnlyRegExp,
    attrRegExp,
    commonAliasSID,
    groupRegExp,
    nameTokens,
    roleOptionRegExp,
    roleRegExp,
    zoneRegExp,
} from './types';
import { nanoid } from 'nanoid';
import { ServerModel } from '../data_model/serverModel';
import { downloadToString, postServerSide } from '../api/serverApi';
import path from 'path';
import { REPOSITORY } from '../data_model';
import { serverApp } from '../api/serverApp';
import { StringTokenizer, defaultBlockSelector } from '../data_model/stringTokenizer';
import { StringBuilder } from '../data_model/stringBuilder';
import _, { Dictionary } from 'lodash';

export async function makeConfigDeployRequest(
    server: ServerModel,
    config: ConfigModel,
    templateContent: string
): Promise<DeployConfigRequestModel[]> {
    const isZoneConfig = Str.includes(config.CONFIG_NM, '{ZONE}');
    const zones = isZoneConfig ? server.zoneList : [server.configMainZone];

    const promiseAll = zones
        .filter((zone) => !Str.isEquals(zone, 'Z'))
        .map(async (zone) => {
            let deployPath = config.DEPLOY_PATH;
            let fullPath = path.join(config.BASE_DIR, deployPath);

            if (isZoneConfig) {
                deployPath = config.DEPLOY_PATH.replace('{ZONE}', zone);
                fullPath = path.join(config.BASE_DIR, deployPath);
            }
            const existFile = await postServerSide('ExistFile', {
                FullPath: fullPath,
                ServerData: server.serverM,
                UserId: '정준호',
            });

            const result: DeployConfigRequestModel = {
                Key: {
                    DEPLOY_SID: nanoid(15),
                },
                CONFIG_SID: config.Key.CONFIG_SID,
                VERSION_NO: config.VERSION_NO,
                OBJECT_SID: server.objectM.Key.OBJECT_SID,
                DEPLOY_PATH: deployPath,
                Server: server,
                Config: config,
                Zone: isZoneConfig ? zone : server.configMainZone,
                IsDeploy: false,
                BEFORE_CONTENTS: existFile
                    ? await downloadToString({
                          FullPath: path.join(config.BASE_DIR, deployPath),
                          ServerData: server.serverM,
                          UserId: '정준호',
                      })
                    : '',
                TEMPLATE_CONTENTS: templateContent,
                // AFTER_CONTENTS:
            };
            return result;
        });

    return Promise.all(promiseAll);
}
export async function makeConfigDeployRequestList(
    server: ServerModel,
    configList: ConfigModel[],
    templateContent: string
) {
    const result: DeployConfigRequestModel[] = [];

    for (const config of configList) {
        result.push(...(await makeConfigDeployRequest(server, config, templateContent)));
    }
    return result;
}

export async function excludeAlias(server: ServerModel, config: ConfigModel, templateContent: string, zone: string) {
    const aliasExceptionList = (
        await serverApp.sendPost('GetListConfigAliasExcpetion', {
            CONFIG_SID: config.Key.CONFIG_SID,
        })
    ).filter((x) => {
        const relation = server.Relations.find((y) => {
            if (!Str.isEquals(y.objectM.Key.OBJECT_SID, x.OBJECT_SID)) {
                return false;
            }
            if (Str.isEquals(y.objectM.OBJECT_TYPE, 'zone') && Str.isEquals(y.objectM.OBJECT_NM, zone)) {
                return true;
            }
            if (!Str.isEquals(y.objectM.OBJECT_TYPE, 'zone')) {
                return true;
            }
            return false;
        });
        return relation;
    });

    if (aliasExceptionList.length) {
        const lines = Str.split(templateContent, '\n').filter((line) => {
            return aliasExceptionList.filter((x) => Str.includes(line, x.EXCEPTION_KEY)).length === 0;
        });
        return lines.join('\n');
    } else {
        return templateContent;
    }
}

export async function bindAlias(server: ServerModel, config: ConfigModel, templateContent: string, zone: string) {
    const excludedTemplate = await excludeAlias(server, config, templateContent, zone);
    const allMacroList = await serverApp.sendPost('GetListConfigMacro', {});
    const macroList = allMacroList.filter((x) => Str.isEquals(x.Key.CONFIG_SID, config.Key.CONFIG_SID));
    const commonMacroList = allMacroList.filter((x) => Str.isEquals(x.Key.CONFIG_SID, commonAliasSID));
    const macroDict = Arr.toMap(
        macroList,
        (x) => x.Key.MACRO_NM,
        (x) => x.MACRO_VALUE
    );
    const commonMacroDict = Arr.toMap(
        commonMacroList,
        (x) => x.Key.MACRO_NM,
        (x) => x.MACRO_VALUE
    );

    const result = resolve(templateContent, (alias) => {
        // group(CENTER)∬zone(E)∬attr(defaultZone)∬default(BA)
        // 형태의 value 에서 값을 찾아오는 로직 추가 필요
        // 공통 alias, 공통 macro와 동일한 이름으로 각 파일에 등록할 수 있음.
        // 파일별 alias, macro 에 없으면 공통에서 찾는 식으로 처리
        let value: string | undefined;

        if ((value = macroDict.get(alias))) {
            return value;
        }

        if ((value = commonMacroDict.get(alias))) {
            return value;
        }

        if ((value = config.AliasList.find((x) => Str.isEquals(x.Key.ALIAS, alias))?.ALIAS_VALUE)) {
            // return findConfigValue(value, zone, server);
        }

        return '';
    });

    return result;
}

export function findConfigValue(configValue: string, deployZone: string, server: ServerModel) {
    /*
     *  Config Value 타입정리
     *  group, zone, role, attr, default
     *  attr 필수 (default로 대체 가능)
     *  group, zone, role, default 옵션
     *
     *  attr -> 속성 단독 (서버, 존, 그룹 순으로 속성을 찾아서 변환)
     *  group()∬attr()
     *  group()∬zone()∬attr()
     *  zone()∬attr()
     *  role()∬attr()
     *  zone()∬role()∬attr()
     *  group()∬zone()∬role()∬attr()
     */
    // let attrValue: string | undefined;
    // if ((attrValue = attrOnlyValue(configValue, deployZone, server))) {
    //     return attrValue;
    // }
}

export function resolve(source: string, valueSelector: (item: string) => string): string | undefined {
    if (!source) {
        return;
    }
    const tokenizer = new StringTokenizer(source);
    const macros = new Map<string, string>();
    const result = new StringBuilder();
    let c1 = tokenizer.pop();

    while (c1) {
        // Parse Mappers
        if (c1 === '$' && tokenizer.eat('{')) {
            if (tokenizer.peek() === '{') {
                // in case of escape, then unescape '${{...}}' => '${...}'
                result.append('$');
                tokenizer.takeUntil(
                    result,
                    (ch) => ch === '}',
                    (ch) => (ch === '{' ? '}' : ch)
                );
            } else {
                result.append(resolveMapperHelper(tokenizer, macros, valueSelector));
            }
        } else if (c1 === '@' && tokenizer.eat('(')) {
            if (tokenizer.peek() === '(') {
                result.append('@');
                tokenizer.takeUntil(
                    result,
                    (ch) => ch === ')',
                    (ch) => (ch === '(' ? ')' : ch)
                );
            } else {
                resolveMacroHelper(tokenizer, macros);
            }
        } else {
            result.append(c1);
        }
    }
    return result.release();
}

export function resolveMapperHelper(
    tokenizer: StringTokenizer,
    macros: Map<string, string>,
    valueSelector: (item: string) => string
) {
    const filter = getResolveFilter(tokenizer);
    let args: string[] | undefined;

    let name = tokenizer.takeWhileToString((ch) => !Arr.includes(nameTokens, ch), defaultBlockSelector);
    let defaultValue: string | undefined;
    let resultValue: string | undefined;

    if (tokenizer.eat('(')) {
        const argString = tokenizer.takeUntilToString((ch) => ch === ')', defaultBlockSelector);
        args = Str.split(argString, ',');
        filter.required = true;
    } else if (tokenizer.eat('=')) {
        defaultValue = tokenizer.takeWhileToString(
            (ch) => ch !== '}',
            (ch) => (ch === '{' ? '}' : ch)
        );
    }

    tokenizer.eat('}');

    if (!args || !(resultValue = macros.get(name))) {
        const execArr = argGroupRegExp.exec(name);
        if (execArr) {
            const matchNames = Str.split(execArr.groups?.[0], '|');

            for (const item of matchNames) {
                const matchName = name.replaceAll(argGroupRegExp, item);
                resultValue = valueSelector(matchName);
                if (resultValue) {
                    name = matchName;
                    break;
                }
            }
        }
        resultValue = valueSelector(name);
    }

    if (!resultValue && defaultValue) {
        resultValue = resolve(defaultValue, valueSelector);
    } else if (args) {
        resultValue = resultValue.replaceAll(argIndexRegExp, (subString, ...args): string => {
            const groups: RegExpExecArray['groups'] = args[args.length - 1];
            let index = parseInt(groups?.['idx']!) - 1;
            const mgroup = groups?.['default'];

            if ((index < 0 || index >= args.length) && mgroup) {
                if (!mgroup.startsWith('@')) {
                    return mgroup;
                }
                index = parseInt(mgroup.substring(1)) - 1;
            }
            return args[index];
        });

        resultValue = resolve(resultValue, valueSelector);
    }

    if (filter.trim) {
        resultValue = resultValue?.trim();
    }

    if (filter.required && !resultValue) {
        throw Error(`A value is not exist for {name} in the collection.`);
    }

    if (resultValue) {
        if (filter.lowerCase) {
            resultValue = resultValue?.toLowerCase();
        }

        if (filter.protected) {
            resultValue = `{SData=${Str.base64urlEncode(resultValue)}}`;
        }
    }

    return resultValue;
}

export function resolveMacroHelper(tokenizer: StringTokenizer, macros: Map<string, string>) {
    let requireTrim = false;

    if (tokenizer.eat('^')) {
        requireTrim = true;
    }

    const name = tokenizer.takeUntilToString((ch) => ch === ')', defaultBlockSelector);
    let value = tokenizer.eatUntil('{').takeUntilToString(
        (ch) => ch === '}',
        (ch) => (ch === '{' ? '}' : ch)
    );

    if (requireTrim) {
        value = value.trim();
    }

    macros.set(name, value);
}

export function getResolveFilter(tokenizer: StringTokenizer) {
    let filter: ResolveFilter = {};
    let c1: string | undefined;

    while ((c1 = tokenizer.peek())) {
        if (c1 === '!') {
            filter.required = true;
        } else if (c1 === '#') {
            filter.protected = true;
        } else if (c1 === '@') {
            filter.lowerCase = true;
        } else if (c1 === '^') {
            filter.trim = true;
        }
        tokenizer.pop();
    }
    return filter;
}
