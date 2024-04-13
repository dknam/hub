import { IECountService } from './service';

export const IUIService = 'IUIService';
export interface IUIService extends IECountService {
    alert(): void;
    confirm(): void;
    readFile(): void;
    writeFile(): void;
    loadFile(): void;
}

export const IIOService = 'IIOService';
export interface IIOService extends IECountService {
    readFile(): void;
    writeFile(): void;
    loadFile(): void;
    setData(): void;
    getData(): void;
}
