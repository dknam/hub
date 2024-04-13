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
            format: ['esm', 'cjs', 'iife'],
            target: ['es2017'],
            globalName: 'core',
            // external: ["react/**/**"],
            // esbuildOptions(options2: any) {
            //   options2.define = {
            //     "process.env.NODE_ENV": JSON.stringify("production"),
            //     "react": "React"
            //   }
            //   options2.banner = {
            //     js: '"use client"',
            //   }
            // },
        },
    };
});
