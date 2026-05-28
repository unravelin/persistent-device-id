import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { mkdirSync } from 'fs';
import { dts } from 'rollup-plugin-dts';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import license from 'rollup-plugin-license';
import packageJson from './package.json' with { type: 'json' };

const entry = 'src/index.ts';

const umdOutput = {
  name: 'PersistentDeviceId',
  esModule: false,
  freeze: false,
  externalLiveBindings: false,
};

const basePlugins = [
  resolve(),
  commonjs({ extensions: ['.js', '.ts'] }),
  replace({
    preventAssignment: true,
    PERSISTENT_DEVICE_ID_VERSION: JSON.stringify(packageJson.version + '-persistent-device-id'),
  }),
  license({
    banner: `/*! <%= pkg.name %> <%= pkg.version %> - https://github.com/unravelin/persistent-device-id. Copyright <%= moment().format('YYYY') %> */`,
  }),
];

function withTypeScript(compilerOptions) {
  const plugins = basePlugins.slice();
  plugins.splice(1, 0, typescript({ compilerOptions: { noCheck: true, ...compilerOptions } }));
  return plugins;
}

export default [
  {
    input: entry,
    plugins: withTypeScript({ outDir: 'build' }),
    output: [
      { file: 'build/persistent-device-id.js', format: 'iife', ...umdOutput },
      {
        file: 'build/persistent-device-id.min.js',
        format: 'iife',
        ...umdOutput,
        plugins: [terser()],
      },
    ],
  },
  {
    input: entry,
    plugins: withTypeScript({
      outDir: 'dist',
      declaration: true,
      declarationDir: 'dist/types',
    }),
    output: { file: 'dist/index.js', format: 'umd', exports: 'default', ...umdOutput },
  },
  {
    input: 'dist/types/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
  {
    input: 'package.json',
    output: { dir: 'dist' },
    plugins: [
      {
        name: 'ensure-dist',
        buildStart() {
          mkdirSync('dist', { recursive: true });
        },
      },
      json(),
      generatePackageJson({
        outputFolder: 'dist',
        baseContents: pkg => ({
          name: pkg.name,
          version: pkg.version,
          license: pkg.license,
          ...(pkg.description && { description: pkg.description }),
          homepage: pkg.homepage,
          bugs: pkg.bugs,
          repository: pkg.repository,
          ...(pkg.dependencies && { dependencies: pkg.dependencies }),
          main: 'index.js',
          types: 'index.d.ts',
          exports: {
            '.': {
              types: './index.d.ts',
              default: './index.js',
            },
          },
          engines: pkg.engines,
        }),
      }),
    ],
  },
];
