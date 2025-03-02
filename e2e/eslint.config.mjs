import playwright from 'eslint-plugin-playwright';

export default [
  playwright.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {},
    ignores: ["**/*.ts"], // this is temporary because eslint doesn't like some of the typescript syntax - need to investigate
  },
];
