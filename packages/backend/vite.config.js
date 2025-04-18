/**********************************************************************
 * Copyright (C) 2023 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { join, resolve } from 'node:path';
import { builtinModules } from 'module';
import { existsSync } from 'node:fs';
import replace from '@rollup/plugin-replace';
import { cp, mkdir } from 'node:fs/promises';

const PACKAGE_ROOT = __dirname;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: process.cwd(),
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '/@gen/': join(PACKAGE_ROOT, 'src-generated') + '/',
      '@shared/': join(PACKAGE_ROOT, '../shared', 'src') + '/',
    },
    mainFields: ['module', 'jsnext:main', 'jsnext'], //https://github.com/vitejs/vite/issues/16444
  },
  build: {
    sourcemap: 'inline',
    target: 'esnext',
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE === 'production' ? 'esbuild' : false,
    lib: {
      entry: 'src/extension.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['@podman-desktop/api', ...builtinModules.flatMap(p => [p, `node:${p}`])],
      output: {
        entryFileNames: '[name].cjs',
      },
      plugins: [
        {
          // copy the swagger-ui-dist files to the dist folder as we need the files to be served
          name: 'copy-swagger-ui',
          async buildStart() {
            const start = performance.now();
            const source = resolve('../../node_modules/swagger-ui-dist');
            const destination = resolve('dist/swagger-ui');

            // Ensure destination directory exists
            if (!existsSync(destination)) {
              await mkdir(destination, { recursive: true });
            }

            // Copy files
            await cp(source, destination, {
              recursive: true,
              filter: source => !source.includes('.map'),
            });
            console.info(`Swagger UI files copied in ${Math.round(performance.now() - start)}ms to dist/swagger-ui`);
          },
        },
      ],
    },
    emptyOutDir: false,
    reportCompressedSize: false,
  },
  plugins: [
    // This is to apply the patch https://github.com/JS-DevTools/ono/pull/20
    // can be removed when the patch is merged
    replace({
      delimiters: ['', ''],
      preventAssignment: true,
      values: {
        'if (typeof module === "object" && typeof module.exports === "object") {':
          'if (typeof module === "object" && typeof module.exports === "object" && typeof module.exports.default === "object") {',
      },
    }),
  ],
};

export default config;
