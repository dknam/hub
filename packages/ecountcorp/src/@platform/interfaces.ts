export interface IHttpClient {
    get: <TResult>(url: string | URL) => Promise<TResult>;
    post: <TRequest, TResult>(url: string | URL, req: TRequest) => Promise<TResult>;
}
export interface IPlatformModule {
    httpClient: IHttpClient;
}
