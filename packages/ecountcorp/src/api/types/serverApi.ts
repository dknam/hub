import { ServerApiRequest } from '.';
import { EcountV5ServiceModel, REPOSITORY, SERVER_M, ServerData } from '../../data_model';
import { ProcessType, RoboCopyType, SERVICE_TYPE, ServiceBehavior } from '../../enum';

export interface ServerFileDto extends ServerApiRequest {
    FullPath: string;
    Option?: 'TopDirectoryOnly' | 'AllDirectories';
}

export interface SearchFileModel {
    FullName: string;
    Name: string;
    Length: number;
}

export interface UploadFileRequest extends ServerApiRequest {
    FullPath: string;
    Bytes: Uint8Array;
}

export interface ExcuteProcessRequestDto extends ServerApiRequest {
    ProcessName?: string;
    Argument?: string;
    WorkDir?: string;
    ProcessType?: ProcessType;
    RunBiz?: boolean;
    BuilderType?: string;
    IsRebuild?: boolean;
    Timeout?: number;
    IsNotCheckExitCode?: boolean;
}

export interface ProcessResultModel {
    Output: string;
    ExitCode: number;
    IsError: boolean;
}

export interface DeleteServerFileRequestDto {
    ServerData: SERVER_M;
    FullPath: string;
}

export interface CommitServerSideRequestDto extends ServerApiRequest {
    BaseDir: string;
    CommitMessage?: string;
    AllowEmpty?: boolean;
}

export interface CheckoutServerSideRequestDto extends ServerApiRequest {
    Repository: REPOSITORY;
    BaseDir?: string;
    RefId: string;
    IsLocalRef?: boolean;
}

export interface fileCopyServerSideRequestDto extends ServerApiRequest {
    RobocopyType?: RoboCopyType;
    BaseDir?: string;
    RepoName?: string;
    SrcPath?: string;
    DestPath?: string;
    FileName?: string;
    ExcludeFiles?: string[];
}

export interface GetServiceListRequestDto extends ServerApiRequest {
    Filter?: string;
    WinServiceName?: string;
    ServiceBehavior?: ServiceBehavior;
    BinPath?: string;
    Options?: string;
}

export interface ControlServiceRequestDto extends ServerApiRequest {
    ServiceType?: SERVICE_TYPE;
    ServiceName?: string;
    ServiceBehavior?: ServiceBehavior;
    BaseDir?: string;
    BinPath?: string;
    Description?: string;
    AutoStart?: boolean;
    ServiceInfo?: EcountV5ServiceModel;
}

export interface DeleteDirectoryRequestDto extends ServerApiRequest {
    DirPath?: string;
    ExceptPaths?: string[];
    Recursive?: boolean;
}
