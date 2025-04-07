export * from './lib';

//#region @backend
import { MagicRenamer } from './lib/magic-renamer';
export async function run(args: string[]) {
  if (args.join() === 'version') {
    console.log('Magic renamer version: v0.0.0 !');
    process.exit(0);
  }
  const ins = MagicRenamer.Instance();
  ins.start(args.join(' '));
  process.exit(0);
}
//#endregion
