module.exports = {
  env: {
    browser: true,
    node: true,
    // seems to most closely match node 12 which we want to support
    // because https://hub.docker.com/r/bastilimbach/docker-magicmirror
    // seems to be the most used docker image and that runs on node 12
    es2019: true,
  },
  globals: {
    config: true,
    Log: true,
    MM: true,
    Module: true,
    moment: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    // I tend to leave unused vars for "completeness" for example in function signatures
    'no-unused-vars': 'off',
  },
};
