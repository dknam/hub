export interface SolutionInfo {
    SOLUTION_ID?: string;
    SOLUTION_NM?: string;
    SOLUTION_PATH?: string;
    REPO?: string;
    ARTIFACT_REPO?: string;
    SHORT_SOLUTION_NM?: string;
}

export interface GetUserInfoRequestDto {
    com_code: string;
    user_id: string;
    password: string;
}

export interface IUserState {
    name?: string;
    login?: boolean;
}
