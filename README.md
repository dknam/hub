# ecount-developer-hub

npm install pnpm
pnpm i
npm run build

### apps

platform based application(vscode, web)

-   ecount.vscode
-   ecount.developer

cli based application(nodejs)

-   app.builder
-   app.testrunner
-   app.deployer

### packages

-   @ecdh/core

    -   타입 및 베이스 클래스 정의
    -   유틸리티 정의
    -   최상위 레이어
    -   cjs / iife로 export 된다

    -   platform기반 모듈
    -   ioc 모듈(node, web)
    -   logger, io, net

-   @ecdh/ecountcorp
-   @ecdh/vscode
-   @ecdh/ui

## IOC

@core에 플랫폼 기반 모듈
기존 service로 개발된 모듈

workspace 구성
https://medium.com/rewrite-tech/visual-studio-code-tips-for-monorepo-development-with-multi-root-workspaces-and-extension-6b69420ecd12

//
//

import job from

view 등록
독립적인 모듈형태

-   플랫폼 별로

application

//
//
//

Container - inversify

ServiceManager
ServiceContainer

Const -

renderer process
vscode
electron
browser

---

    command handler
    webviewPanel.webview api

main process
nodejs
webservice

유저 로그인
화면 랜더링 - vscode: htmlviewer 로딩 > 로그인 페이지 로딩 - web: route > 로그인 페이지 로딩

application layer

application

application entry

packages/@core

## ui 구조

app 전체 상태를 정의하기는 어렵다
vscode는 하나의 view가 독립된 window에 로딩된다(webview)
모든 view는 컴포넌트 state로 데이터를 관리한다.

##

##

renderer process(browser, chromium)

-   기본적인 browser 베이스의 로직은 모두 구현 가능하다
-   ecdh에서 제공하는 event를 구독 / 발행 가능하다(주로 view, lifecycle 관련 이벤트)
-   rpc service를 주입받아 사용 가능하다.
-   주로 ecountcorp에서 제공하는 api
    main process
-   route service
-   rpc service

## configure application

[main] application configure

-   vscode(vscode api로 구성), electron(electron api로 구성), browser(개발 필요)
-   각 main process별 entry 로직 구성
-   => 모두 통합할수 있는 application entry 인터페이스 필요
-   ecount-application(@ecdh/core)에 필요한 서비스 등록한다(사용할 플랫폼 특정 된다)
-   rpc service 특정(node(vscode, electron / http기반), browser / http 기반) <= command handler에 전달된다(@ecdh/core)
-   route service 특정(vscode / webview api, browser(electron, browser / 리액트 기반 router))

## launch view

startUp() 메소드 내부에 구현
vscode인 경우 특정 커맨드 subscribe하는 형태로 등록
electron인 경우 바로 생성

```ts
const { app, BrowserWindow } = require('electron');

// Electron 애플리케이션이 준비되면 실행될 함수
app.on('ready', () => {
    // 새로운 브라우저 창 생성
    const mainWindow = new BrowserWindow({
        width: 800, // 창의 너비
        height: 600, // 창의 높이
        webPreferences: {
            nodeIntegration: true, // 렌더러 프로세스에서 Node.js API를 사용할 수 있도록 설정
        },
    });

    // 브라우저 창에 로딩할 HTML 파일 경로 지정
    mainWindow.loadFile('index.html');

    // 개발자 도구 열기 (선택 사항)
    // mainWindow.webContents.openDevTools();

    // 메인 창이 닫힐 때 애플리케이션 종료
    mainWindow.on('closed', () => {
        app.quit();
    });
});
```
