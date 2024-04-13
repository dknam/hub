import { IEcCommand } from './command';

export interface ViewCommand extends IEcCommand {
    path: string; // view component path
    anonymous?: boolean; // 세션 체크 여부
    permission?: any; // 접근 권한 체크 여부
}

export const LoadViewLoginCommand = 'LoadViewLoginCommand';
export interface LoadViewLoginCommand extends ViewCommand {}
