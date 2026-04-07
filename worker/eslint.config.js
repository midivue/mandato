import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist', '.wrangler'] },
  {
    files: ['**/*.ts'],
    languageOptions: { ecmaVersion: 2022 },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.reduce(
        (acc, cfg) => ({ ...acc, ...cfg.rules }),
        {},
      ),
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
    },
  },
]
