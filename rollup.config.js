/* eslint-env node */

const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const url = require('@rollup/plugin-url');

const css = require('rollup-plugin-css-only');

const distDirectory = './media';

module.exports = [
  {
    input: 'src/client/bpmn-editor.js',
    output: {
      sourcemap: true,
      format: 'iife',
      file: distDirectory + '/bpmn-editor.js'
    },
    plugins: [
      url({
        fileName: '[dirname][filename][extname]',
        publicPath: '/media/'
      }),

      css({ output: 'bpmn-editor.css' }),

      resolve(),
      commonjs()
    ],
    watch: {
      clearScreen: false
    }
  }
];
