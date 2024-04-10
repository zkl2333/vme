import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/moderateIssue.ts", // 你的主入口文件
  output: {
    file: "dist/moderateIssue.js", // 输出文件
    format: "esm", // 输出格式，根据需要选择 'cjs' (CommonJS), 'esm' (ES Module) 等
  },
  plugins: [
    typescript(), // 使用 @rollup/plugin-typescript 插件
  ],
};
