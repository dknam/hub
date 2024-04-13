import { CommitModel } from '../data_model/gitModels';
import ContractBase from './contractBase';
import { GetCommitRequestDto } from './types/gitApp';

class GitApp extends ContractBase {
    constructor() {
        super('ECount.Deploy.GitApp', 'ECount.Deploy.GitApp.GitAppFeatures');
    }

    async sendPost(funcName: 'GetCommit', body: GetCommitRequestDto): Promise<CommitModel>;
    async sendPost<TRequest, TResult>(funcName: string, body: TRequest): Promise<TResult> {
        var response = this.post<TRequest, TResult>(funcName, body);
        return response;
    }
}

export const gitApp = new GitApp();
