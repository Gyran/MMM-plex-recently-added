module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2022: true,
    node: true
  },
  globals: {
    config: true,
    Log: true,
    MM: true,
    Module: true,
    moment: true
  },
  extends: 'standard',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    eqeqeq: 'error',
    'import/order': 'error',
    'no-prototype-builtins': 'off',
    'no-throw-literal': 'error',
    'no-useless-return': 'error',
    'prefer-template': 'error',
    'no-console': 'warn'
  }
}
