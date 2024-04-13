import * as vscode from 'vscode';
import { ecservice } from '@ecdh/core';
import { configureApplication } from '@ecdh/vscode';
import { RouteService } from './service/router';

// This line should always be right on top.
// Other extensions use this, re-importing will cause data stored by this to wipe out data in other extensions using this same package.
if ((Reflect as any).metadata === undefined) {
    require('reflect-metadata');
}

const menuTree = [
    {
        id: 'job_list', // view id
        view_path: 'job_list',
    },
    {
        id: 'deploy_list', // view id
    },
] as vscode.TreeItem[];

export const exposed = configureApplication(
    async function activate(configure) {
        // [#] 메뉴 등록
        configure.registerService(
            //ecservice.IECountRouteService,
            'IECountRouteService',
            new RouteService('ecount-developer-hub-router', menuTree)
        );
    },
    async function deactivate(configure) {}
);

export const activate = exposed.activate;
export const deactivate = exposed.deactivate;
