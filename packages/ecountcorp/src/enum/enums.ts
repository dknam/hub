export const enum OS {
    WINDOWS = 'Windows',
    LINUX = 'Linux',
}

export const enum RoboCopyType {
    None,
    DbScripts,
    WebResource,
    File,
    Folder,
}

export const enum BuilderType {
    None,
    ECERP,
    ECWebMail,
    ECINVOICE,
}

export const enum ServiceBehavior {
    None,
    Create,
    Start,
    Stop,
    Delete,
    Run,
    Kill,
}

export const enum ServiceControllerStatus {
    Stopped,
    StartPending,
    StopPending,
    Running,
    ContinuePending,
    PausePending,
    Pause,
}

export const enum SERVICE_TYPE {
    WebService,
    ECountV5,
    XDeploy,
}

export const enum ProcessType {
    None,
    Builder,
    Optimizer,
    Git,
    IISReset,
    PreCompile,
    Sync,
    Deploy,
}

export const enum DiffType {
    A,
    M,
    D,
}
