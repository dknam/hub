import { IStore } from './type';

export class MemoryStoreImple implements IStore {
    private dict = new Map<string, any>();

    public async has(key: string) {
        return this.dict.has(key);
    }
    public async set<T>(key: string, value: T) {
        this.dict.set(key, value);
    }
    public async get<T>(key: string) {
        return this.dict.get(key) as T;
    }
    public async getOrAdd<T>(key: string, intialValue: () => T | Promise<T>) {
        if (this.dict.has(key)) {
            return this.dict.get(key) as T;
        }

        const initailValue = intialValue();
        this.dict.set(key, initailValue);
        return initailValue;
    }
    public async delete(key: string) {
        this.dict.set(key, null);
    }
}
