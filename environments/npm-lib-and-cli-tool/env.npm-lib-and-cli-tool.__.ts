import type { EnvOptions } from 'tnp/src';
import baseEnv from '../../env';

const env: Partial<EnvOptions> = {
  ...baseEnv,
  build: {
    prod: true,
  },
  release: {
    cli: {
      includeNodeModules: true,
    },
  },
};
export default env;
