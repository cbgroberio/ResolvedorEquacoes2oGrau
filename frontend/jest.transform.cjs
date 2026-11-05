const { createTransformer } = require('@swc/jest');

const swcTransformer = createTransformer({
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    transform: {
      react: {
        runtime: 'automatic',
      },
    },
    target: 'es2022',
  },
  module: {
    type: 'commonjs',
  },
});

module.exports = {
  process(src, filename, jestOptions) {
    const transformedSrc = src
      .replace(/import\.meta\.hot/g, 'undefined')
      .replace(/import\.meta\.env/g, '({})');
    return swcTransformer.process(transformedSrc, filename, jestOptions);
  },
  getCacheKey(src, filename, ...rest) {
    const transformedSrc = src
      .replace(/import\.meta\.hot/g, 'undefined')
      .replace(/import\.meta\.env/g, '({})');
    return swcTransformer.getCacheKey(transformedSrc, filename, ...rest);
  },
};

