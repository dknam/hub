import * as vscode from 'vscode';
import { ECountApplicationContext } from '@ecdh/core';

type Configure = Pick<
    ECountApplicationContext<vscode.ExtensionContext>,
    'registerService' | 'registerContributor' | 'on'
>;
type ConfigureApplication = (configure: Configure) => Promise<void>;

class VscodeExtensionApplicationContext extends ECountApplicationContext<vscode.ExtensionContext> {
    async initializeEventHandlerAsync() {}
}

export const configureApplication = (activate: ConfigureApplication, deactivate: ConfigureApplication) => {
    const applicationContext = new VscodeExtensionApplicationContext();

    return {
        activate: async (context: vscode.ExtensionContext): Promise<void> => {
            (applicationContext as ECountApplicationContext<vscode.ExtensionContext>).executionContext = context;
            await activate(applicationContext);
            await applicationContext.startUp();
        },
        deactivate: async (context: vscode.ExtensionContext): Promise<void> => {
            await deactivate(applicationContext);
        },
    };
};

function subscribeCommand() {}
