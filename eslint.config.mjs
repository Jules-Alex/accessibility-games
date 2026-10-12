import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:state', 'type:domain', 'type:defi'] },
            { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:ui', 'type:state', 'type:domain'] },
            { sourceTag: 'type:defi', onlyDependOnLibsWithTags: ['type:ui', 'type:state', 'type:domain'] },
            { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:domain'] },
            { sourceTag: 'type:state', onlyDependOnLibsWithTags: ['type:domain'] },
            { sourceTag: 'type:domain', onlyDependOnLibsWithTags: [] },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
