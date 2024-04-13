import { SERVER_M } from '../../data_model';

export interface DefaultResponse<TData> {
    statusCode: number;
    errors: string[];
    Data: TData;
}

export interface ServerApiRequest {
    ServerData: SERVER_M;
    Port?: number;
    UserId: string;
    LogKey?: string;
}

export * from './dataBaseApp';
export * from './deployApp';
export * from './languageResourceApp';
export * from './mainApp';
export * from './serverApp';
export * from './serverApi';
