import { ECountApplicationContext } from '..';

export type ECountApplicationEvent = {
    id: string;
};

// export type registerCommand = (applicationContext: ECountApplicationContext<vscode.ExtensionContext>) => void;
export const registerEventHandler = <TPlatformBasedContext>(
    eventIdentifier: string,
    handler: (
        applicationContext: ECountApplicationContext<TPlatformBasedContext>,
        event: ECountApplicationEvent
    ) => Promise<void>
) => {};

export const EVENT_VIEW_CHANGE = 'EVENT_VIEW_CHANGE';
export interface EVENT_VIEW_CHANGE {}
