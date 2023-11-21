module.exports = {
  extends: ['airbnb-base',     "oclif",
		"oclif-typescript", 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  plugins: ['@typescript-eslint', 'prettier', 'deprecation'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {},
    },
    'import/core-modules': ['electron'],
  },
  rules: {
    'prettier/prettier': 'error',
    'deprecation/deprecation': 'warn',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],

    '@typescript-eslint/ban-ts-ignore': 'off',
    'import/prefer-default-export': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    '@typescript-eslint/interface-name-prefix': 'off',
    // above is our standard configuration.

    // These are partially fixed, marked with todo comments
    // 'no-async-promise-executor': 'off',
    // '@typescript-eslint/no-explicit-any': 'off',

    // should fix these:
    // TODO SOON fix all explicit-function-return-type
    '@typescript-eslint/explicit-function-return-type': 'off',

    // hard to change
    'import/no-cycle': 'off',

    // Fix Typescript enums being flagged for no-shadow
    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-shadow.md#how-to-use
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],

    // Allow leading _ only in member variables
    // https://eslint.org/docs/rules/no-underscore-dangle#options
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
  },
};
