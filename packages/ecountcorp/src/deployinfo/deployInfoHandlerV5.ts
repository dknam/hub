import { DeployInfoHandlerBase } from './deployInfoHandlerBase';
import { DeployInfoModel } from './types';

export class DeployInfoHandlerV5 extends DeployInfoHandlerBase {
    filePath: string = '/data/ecountv5/vshared/deployinfo.conf';
    parse(content: string): DeployInfoModel {
        return JSON.parse(content);
    }
    toString(model: DeployInfoModel): string {
        return JSON.stringify(model);
        // return JSON.stringify(model, (key, value) => {
        //     const modelKey = key as keyof DeployInfoModel;

        //     if (modelKey === 'SSDB') {
        //         const modelValue = value as DeployInfoModel['SSDB'];
        //         const originData = modelValue.EntityCache as FakeSSDBEntityCache;
        //         let disableCategories: string[] = [];
        //         let disableTargets: string[] = [];
        //         let nol4Targets: string[] = [];

        //         for (const key in originData) {
        //             if (originData[key].DisableCategory) {
        //                 disableCategories.push(key);
        //             }
        //             disableTargets.concat(originData[key].DisableTargets.split(ecountSeparator));
        //             nol4Targets.concat(originData[key].Nol4Targets.split(ecountSeparator));
        //         }
        //         modelValue.EntityCache = {
        //             DisableCategories: disableCategories.join(ecountSeparator),
        //             DisableTargets: disableTargets.join(ecountSeparator),
        //             Nol4Targets: nol4Targets.join(ecountSeparator),
        //         };
        //         return modelValue;
        //     }
        //     return value;
        // });
    }
}
