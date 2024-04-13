import { DiffType } from '../enum';

export interface CommitModel {
    CommitId?: string;
    Msg?: string;
    Author?: string;
    CommitDate?: Date;
    DiffFileInfo?: GitDiffFileInfo[];
}

export interface GitDiffFileInfo {
    DiffType?: DiffType;
    GitPath?: string;
}

export interface REPOSITORY {
    KEY: {
        PROJECT_ID: string;
        IS_PRODUCT: boolean;
    };
    GIT_URL?: string;
    REPO?: string;
    REPO_NM?: string;
    REPO_FORDER?: string;
    ARTIFACT?: boolean;
    ARTIFACT_SITE?: string;
    SOLUTION_NM?: string;
    REG_DATE?: Date;
    REMOTE_NAME?: string;
    SHORT_SOLUTION_NM?: string;
}
