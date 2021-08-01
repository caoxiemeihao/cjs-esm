import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

/**
 * @type {import('rollup').RollupOptions}
 */
const rollupOptions = {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript(),
  ],
}

export default rollupOptions
