import ContractBase from './contractBase';
import { GetUserInfoRequestDto, SolutionInfo } from './types';

class MainApp extends ContractBase {
    constructor() {
        super('ECount.Deploy.MainApp', 'ECount.Deploy.MainApp.MainAppFeatures');
    }
    sendPost(funcName: 'GetSolutionList', req: SolutionInfo): Promise<SolutionInfo[]>;
    sendPost(funcName: 'CheckUserInfo', req: GetUserInfoRequestDto): Promise<boolean>;
    sendPost<TRequest, TResult>(funcName: string, req: TRequest): Promise<TResult> {
        var response = this.post<TRequest, TResult>(funcName, req);
        return response;
    }
}

export const mainApp = new MainApp();
