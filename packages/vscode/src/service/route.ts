import * as vscode from 'vscode';
import { ECountApplicationContext, ecservice, ecevent } from '@ecdh/core';
import path from 'path';

/**
 * vscode의 route service는 activitybar를 통한 sidebar 패널을 제공한다.
 * 반드시 해당 app의 package.json에 contribute를 지정해야 한다.
 * sibar의 메뉴 구성은 vscode.TreeItem 인터페이를 따른다.
 */
export class VscodeExtensionRouteService extends ecservice.ECountRouteService<
    vscode.ExtensionContext,
    vscode.TreeItem
> {
    constructor(
        public contributorId: string, // package.json에 정의된 activitybar id
        menus: vscode.TreeItem[]
    ) {
        super(menus);
    }
    getTreeItem(element: string): vscode.TreeItem | undefined {
        const item = this.menus.find((menu) => menu.id == element);
        if (item && item.id) {
            const id = item.id;
            return {
                label: id,
                id: id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: /* ecevent.EVENT_VIEW_CHANGE */ `EVENT_VIEW_CHANGE`,
                    title: `Open ${id}`,
                    arguments: [item],
                },
            };
        }
    }

    async getChildren(element?: string): Promise<string[]> {
        return this.menus.map((menu) => menu.id || `unknown_${Date.now()}`);
    }

    changeView = async (event: any /*eccommand.ViewCommand*/): Promise<void> => {
        // const menuName = event.name;
        // // const views = this.htmlView.get(menuName) ?? [];
        // const webviewPanel = vscode.window.createWebviewPanel('browser', menuName, vscode.ViewColumn.One, {
        //     enableScripts: true,
        //     retainContextWhenHidden: true,
        //     localResourceRoots: [vscode.Uri.file(path.join(vscode.env.appRoot, 'browser'))],
        // });
        // // const id = nanoid(15);
        // // const webViewInfo: WebViewPanelInfo = {
        // //     name: menuName,
        // //     id: id,
        // //     webViewPanel: webviewPanel,
        // // };
        // // views.push(webViewInfo);
        // // this.htmlView.set(menuName, views);
        // webviewPanel.webview.onDidReceiveMessage(async (message: IPostMessage) => {
        //     try {
        //         const receiveHandler = this.serviceContainer.get<IReceiveHandler>(message.identifier);
        //         const result = await receiveHandler[message.cmd].call(receiveHandler, message.payload);
        //         // await중 webview가 dispose 되는 경우 에러 => 다시 webview를 찾고 있으면 결과를 응답
        //         const webview = this.htmlView.get(menuName)?.find((view) => view.id === id)?.webViewPanel;
        //         if (webview) {
        //             webview.webview.postMessage({
        //                 requestId: message.requestId,
        //                 payload: result,
        //             });
        //         }
        //     } catch (ex) {
        //         window.showErrorMessage((ex as Error).message);
        //         webviewPanel.webview.postMessage({
        //             requestId: message.requestId,
        //             error: ex,
        //         });
        //     }
        // });
        // webviewPanel.onDidDispose(() => {
        //     let views = this.htmlView.get(menuName)?.filter((v) => v.id !== id);
        //     this.htmlView.set(menuName, views ?? []);
        //     if ((views?.length ?? 0) < 1) {
        //         this.commandManager.executeCommand(commands.dispose(menuName));
        //     }
        // });
        // webviewPanel.webview.html = this.getHtmlContent(webViewInfo, menuName);
    };

    async loadMenu(): Promise<void> {
        vscode.window.createTreeView(this.contributorId, {
            treeDataProvider: this as unknown as vscode.TreeDataProvider<string>,
        });
    }

    async registerCommand() {
        vscode.commands.registerCommand(/* ecevent.EVENT_VIEW_CHANGE */ 'EVENT_VIEW_CHANGE', this.changeView);
    }

    async startUp(): Promise<void> {
        await this.registerCommand();
        await this.loadMenu();
    }
}

function getWebviewContent(webview: vscode.Webview) {
    // const reactUri = `${webview.asWebviewUri(vscode.Uri.file(path.join('lib', 'react.development.17.0.2.js')))}`;
    // const reactDomUri = `${webview.asWebviewUri(vscode.Uri.file(path.join('lib', 'react-dom.development.17.0.2.js')))}`;
    // console.log(reactUri);
    // console.log(reactDomUri);
    // Return HTML content for the webview with React
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sample WebView with React</title>
        </head>
        <body sandbox="allow-scripts allow-same-origin">
            <div id="root"></div>
            <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
            <script src="rpc-service.js"></script>
            <script>
                // Define your React component
                function App() {
                    return React.createElement('h1', null, 'Hello, React in WebView!');
                }
                // Render the React component into the 'root' div
                ReactDOM.render(
                    React.createElement(App),
                    document.getElementById('root')
                );
            </script>
        </body>
        </html>
    `;
}
// platform
// - browser

// - node
