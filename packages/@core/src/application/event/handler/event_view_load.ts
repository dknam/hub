import * as vscode from 'vscode';
import { ecevent } from '../..';

ecevent.registerEventHandler<vscode.ExtensionContext>(ecevent.EVENT_VIEW_CHANGE, async (applicationContext, event) => {
    // 현재 네비게이션 정보 관리 어떻게 할지
    // view에 종속된 데이터는 ui에서 처리한다(rpc service)
    // route service는 뷰를 로딩하고 필요한 service를 주입해준다.
    const routeService =
        applicationContext.getService<ecservice.IECountRouteService<vscode.ExtensionContext, vscode.TreeItem>>(
            'IECountRouteService'
        );
    if (routeService) {
        // routeService.changeView(event);
    }
});
