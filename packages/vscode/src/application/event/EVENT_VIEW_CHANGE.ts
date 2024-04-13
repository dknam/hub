import { ecevent } from '@ecdh/core';
import * as vscode from 'vscode';
import { commands } from 'vscode';

ecevent.registerEventHandler<vscode.ExtensionContext>(
    /*ecevent.EVENT_VIEW_CHANGE*/ 'EVENT_VIEW_CHANGE',
    (applicationContext) => {
        commands.registerCommand('EVENT_VIEW_CHANGE', (...args) => {
            console.log(args);
        });
    }
);
