import { defineConfig, type Options } from 'tsup';

export default defineConfig((options: Options) => {
    return {
        banner: {
            js: "'use client'",
        },
        ...options,
        ...{
            injectStyle: true,
            dts: true,
            sourcemap: true,
            format: ['iife'],
            target: ['es2017'],
            globalName: 'ecdh_ui',
            esbuildOptions(options2: any) {
                options2.external = ['react'];
                options2.define = {
                    react: 'React',
                };
            },
        },
    };
});
