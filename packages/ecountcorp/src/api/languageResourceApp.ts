import ContractBase from './contractBase';
import { SearchResourceModel, SearchResourceResultModel } from './types';

class LanguageResourceApp extends ContractBase {
    constructor() {
        super('ECount.Deploy.LanguageResourceApp', 'ECount.Deploy.LanguageResourceApp.LanguageResourceAppFeatures');
    }

    async sendPost(funcName: 'SearchResource', body: SearchResourceModel): Promise<Array<SearchResourceResultModel>>;
    async sendPost<TRequest, TResult>(funcName: string, body: TRequest): Promise<TResult> {
        var response = this.post<TRequest, TResult>(funcName, body);
        return response;
    }
}

export const languageResourceApp = new LanguageResourceApp();
