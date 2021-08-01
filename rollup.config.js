import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

/**
 * @type {import('rollup').RollupOptions}
 */
const rollupOptions = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.mjs',
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript(),
  ],
}

export default rollupOptions
