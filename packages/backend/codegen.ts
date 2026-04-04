import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  documents: './src/seventv/queries/*.graphql',
  generates: {
    './src/seventv/gql/': {
      config: {
        skipTypename: true,
        useTypeImports: true,
      },
      plugins: [],
      preset: 'client',
    },
  },
  schema: 'https://7tv.io/v4/gql',
}

export default config
