if ((Reflect as any).metadata === undefined) {
    require('reflect-metadata');
}

import { Container } from 'inversify';

const container = new Container();

export interface Newable<T> {
    new (...args: any[]): T;
}
export interface Abstract<T> {
    prototype: T;
}

export function addSingleton<T>(
    serviceIdentifier: string | symbol | Newable<T> | Abstract<T>,
    constructorOrInstance: new (...args: any[]) => T | T,
    name?: string | number | symbol | undefined
): void {
    if (typeof constructorOrInstance === 'object') {
        if (name) {
            container.bind<T>(serviceIdentifier).toConstantValue(constructorOrInstance).whenTargetNamed(name);
        } else {
            container.bind<T>(serviceIdentifier).toConstantValue(constructorOrInstance);
        }
    } else {
        if (name) {
            container.bind<T>(serviceIdentifier).to(constructorOrInstance).inSingletonScope().whenTargetNamed(name);
        } else {
            container.bind<T>(serviceIdentifier).to(constructorOrInstance).inSingletonScope();
        }
    }
}
export function get<T>(
    serviceIdentifier: string | symbol | Newable<T> | Abstract<T>,
    name?: string | number | symbol | undefined
): T {
    return name ? container.getNamed<T>(serviceIdentifier, name) : container.get<T>(serviceIdentifier);
}
export function getAll<T>(
    serviceIdentifier: string | symbol | Newable<T> | Abstract<T>,
    name?: string | number | symbol | undefined
): T[] {
    return name ? container.getAllNamed<T>(serviceIdentifier, name) : container.getAll<T>(serviceIdentifier);
}

export const test = {};
