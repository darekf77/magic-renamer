import { MagicRenamer } from './magic-renamer';

export async function run(args: string[]) {
  const ins = MagicRenamer.Instance();
  ins.start(args.join(' '));
  process.exit(0)
}
