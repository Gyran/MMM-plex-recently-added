module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2022: true,
    node: true,
  },
  globals: {
    config: true,
    Log: true,
    MM: true,
    Module: true,
    moment: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: [
    // I tend to leave unused vars for "completeness" for example in function signatures
    ['no-unused-vars', 'off'],
  ],
};
