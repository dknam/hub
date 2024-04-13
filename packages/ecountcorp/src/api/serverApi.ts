import { ServiceStateModel } from '../data_model';
import {
    ExcuteProcessRequestDto,
    ProcessResultModel,
    SearchFileModel,
    ServerFileDto,
    UploadFileRequest,
    DefaultResponse,
    ServerApiRequest,
    DeleteServerFileRequestDto,
    CommitServerSideRequestDto,
    CheckoutServerSideRequestDto,
    fileCopyServerSideRequestDto,
    GetServiceListRequestDto,
    ControlServiceRequestDto,
    DeleteDirectoryRequestDto,
} from './types';

function makeRequest<T extends ServerApiRequest>(funcName: string, req: T) {
    return {
        Header: {
            FuncName: funcName,
            EndPoint: req.ServerData.SERVER_IP,
            Port: req.Port ?? '3008',
        },
        Body: req,
    };
}
function post<TRequest extends ServerApiRequest, TResult>(funcName: string, req: TRequest) {
    return fetch('http://10.10.9.61:3007/api/v1/ServerSide', {
        method: 'POST',
        headers: new Headers({
            'Content-type': 'application/json; charset=utf-8',
        }),
        body: JSON.stringify(makeRequest(funcName, req)),
    })
        .then((res) => res.json() as Promise<DefaultResponse<TResult>>)
        .then((obj) => obj.Data as TResult);
}

export async function upload(req: UploadFileRequest) {
    const formData = new FormData();
    const httpRequest = makeRequest('UploadFile', req);
    const fileName = req.FullPath.substring(req.FullPath.lastIndexOf('/') + 1);

    formData.append(fileName, new Blob([req.Bytes], { type: 'application/octet-stream' }), fileName);
    formData.append('PostData', JSON.stringify(httpRequest));
    await fetch('http://10.10.9.61:3007/api/v1/UploadServerSide', {
        method: 'POST',
        body: formData,
    });
}

export function download(req: ServerFileDto) {
    return fetch('http://10.10.9.61:3007/api/v1/DownloadServerSide', {
        method: 'POST',
        headers: new Headers({
            'Content-type': 'application/json; charset=utf-8',
        }),
        body: JSON.stringify(makeRequest('DownloadFile', req)),
    }).then((res) => res.arrayBuffer());
}
export function downloadToString(req: ServerFileDto) {
    return download(req).then((res) => {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(res);
    });
}

export function postServerSide(funcName: 'DeleteDirectory', req: DeleteDirectoryRequestDto): Promise<boolean>;
export function postServerSide(funcName: 'ControlService', req: ControlServiceRequestDto): Promise<boolean>;
export function postServerSide(
    funcName: 'GetWinServiceStateViewList',
    req: GetServiceListRequestDto
): Promise<ServiceStateModel[]>;
export function postServerSide(funcName: 'RobocopyProcess', req: fileCopyServerSideRequestDto): Promise<boolean>;
export function postServerSide(funcName: 'Checkout', req: CheckoutServerSideRequestDto): Promise<boolean>;
export function postServerSide(funcName: 'Commit', req: CommitServerSideRequestDto): Promise<boolean>;
export function postServerSide(funcName: 'DeleteServerFile', req: DeleteServerFileRequestDto): Promise<boolean>;
export function postServerSide(funcName: 'GetSubFileInfo', req: ServerFileDto): Promise<SearchFileModel[]>;
export function postServerSide(funcName: 'GetSubDirectoryInfo', req: ServerFileDto): Promise<SearchFileModel[]>;
export function postServerSide(funcName: 'ExcuteProcess', req: ExcuteProcessRequestDto): Promise<ProcessResultModel>;
export function postServerSide(funcName: 'ExistFile', req: ServerFileDto): Promise<boolean>;
export function postServerSide<TRequest extends ServerApiRequest, TResult>(
    funcName: string,
    req: TRequest
): Promise<TResult> {
    return post(funcName, req);
}
