import type { EnvOptions } from 'tnp/src';
import baseEnv from './env.npm-lib-and-cli-tool.__';

const env: Partial<EnvOptions> = {
  ...baseEnv,
  build: {
    prod: false,
  },
  release: {
    cli: {
      includeNodeModules: true,
    },
  },
};
export default env;
