import { defineConfig, type Options } from 'tsup';

export default defineConfig((options: Options) => {
    return {
        external: ['vscode'],
        ...options,
        ...{
            injectStyle: true,
            dts: true,
            sourcemap: true,
            format: ['cjs'],
            target: ['esnext'],
        },
    };
});
