// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      './playground/**/*',
      // eslint ignore globs here
    ],
  },
  {
    rules: {
      // overrides
    },
  },
)
