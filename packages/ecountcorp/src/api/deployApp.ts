import ContractBase from './contractBase';
import { JobFileInfo, JobInfo, SearchJobFileRequestDto } from './types';

class DeployApp extends ContractBase {
    constructor() {
        super('ECount.Deploy.DeployApp', 'ECount.Deploy.DeployApp.DeployAppFeatures');
    }

    async sendPost(funcName: 'SetJobInsert', body: JobInfo): Promise<boolean>;
    async sendPost(funcName: 'SelectJobFileInfos', body: SearchJobFileRequestDto): Promise<Array<JobFileInfo>>;
    async sendPost<TRequest, TResult>(funcName: string, body: TRequest): Promise<TResult> {
        var response = this.post<TRequest, TResult>(funcName, body);
        return response;
    }

    selectJobInfos = async (parmams: SearchJobFileRequestDto) => this.sendPost('SelectJobFileInfos', parmams);
}

export const deployApp = new DeployApp();
