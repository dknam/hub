import { DefaultResponse } from './types';
import platformModuleLoader from '../@platform';

interface IDeployServerRequest<TRequest> {
    Header: {
        AppName: string;
        TypeName: string;
        FuncName: string;
    };
    Body: TRequest;
}

export default abstract class ContractBase {
    protected appName: string;
    protected typeName: string;

    constructor(appName: string, typeName: string) {
        this.appName = appName;
        this.typeName = typeName;
    }

    protected post<TRequest, TResult>(funcName: string, body: TRequest): Promise<TResult> {
        return fetch('http://10.10.9.61:3007/api/v1/RouterPost', {
            method: 'POST',
            headers: new Headers({
                'Content-type': 'application/json; charset=utf-8',
            }),
            body: JSON.stringify({
                Header: {
                    AppName: this.appName,
                    TypeName: this.typeName,
                    FuncName: funcName,
                },
                Body: body,
            }),
        })
            .then((res) => res.json() as Promise<DefaultResponse<TResult>>)
            .then((obj) => obj.Data as TResult)
            .catch((reason) => {
                throw reason;
            });
    }
}
