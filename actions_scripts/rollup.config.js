import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'

const config = {
  input: [
    'src/moderateIssue.ts',
    'src/createData.ts',
    'src/manualModeration.ts',
  ], // 你的主入口文件
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    typescript(),
    commonjs(),
  ],
}

export default config
