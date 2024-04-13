export interface IStore {
    has: (key: string) => Promise<boolean>;
    set: <T>(key: string, value: T) => Promise<void>;
    get: <T>(key: string) => Promise<T>;
    getOrAdd: <T>(key: string, intialValue: () => T | Promise<T>) => Promise<T>;
    delete: (key: string) => Promise<void>;
}
