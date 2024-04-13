import { IHttpClient } from '..';

const httpClient = (): IHttpClient => {
    const get = <TResult>(url: string | URL) =>
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-type': 'application/json; charset=utf-8',
            }),
        }).then((res) => res.json() as Promise<TResult>);

    const post = <TRequest, TResult>(url: string | URL, req: TRequest) =>
        fetch(url, {
            method: 'POST',
            headers: new Headers({
                'Content-type': 'application/json; charset=utf-8',
            }),
            body: JSON.stringify(req),
        }).then((res) => res.json() as Promise<TResult>);

    return {
        get: get,
        post: post,
    };
};
export default httpClient();
