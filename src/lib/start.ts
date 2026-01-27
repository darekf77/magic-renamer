import { MagicRenamer } from './magic-renamer';

export async function start(argsv: string[]): Promise<void> {
  //#region @backendFunc
  if (argsv.join() === 'version') {
    console.log('Magic renamer version: v0.0.0 !');
    process.exit(0);
  }
  const ins = MagicRenamer.Instance();
  ins.start(argsv.join(' '));
  process.exit(0);
  //#endregion
}
