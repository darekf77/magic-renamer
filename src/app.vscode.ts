import { MagicRenamer } from 'magic-renamer/src';
import { crossPlatformPath, Utils, _ } from 'tnp-core/src';
import { CommandType, executeCommand } from 'tnp-helpers/src';
import type { ExtensionContext } from 'vscode';

const group = 'MagicRenamer CLI essentials';

export const commands: CommandType[] = (
  [
    {
      group: null,
      title: 'MAGIC RENAME',
      exec: params => {
        console.log(params);
        const firstSelected =
          params.selectedUris.length > 0 && _.first(params.selectedUris).path;
        const selectedCwd = firstSelected
          ? crossPlatformPath(firstSelected)
          : '';
        if (selectedCwd) {
          const magicRenamer = MagicRenamer.Instance(selectedCwd);
          magicRenamer.start(
            params.resolveVariables.map(f => f.variableValue).join(' '),
          );
        } else {
          params.vscode.window.showErrorMessage(`Wrong file`)
        }
      },
      options: {
        titleWhenProcessing: `Magic renamer is magically renaming files and folders..`,
        cancellable: false,
        resolveVariables: [
          {
            variable: 'rules',
            placeholder: `%fileName% -> %fileName%-new`,
            encode: true,
          },
        ],
      },
    },
  ] as CommandType[]
).map(c => {
  // if (!c.group) {
  //   c.group = group;
  // }
  if (!c.command) {
    c.command = `extension.${Utils.camelize(c.group ?? 'ROOT')}.${Utils.camelize(c.title)}`;
  }
  return c;
});

export function activate(context: ExtensionContext): void {
  for (let index = 0; index < commands.length; index++) {
    const {
      title = '',
      command = '',
      exec = '',
      options,
      isDefaultBuildCommand,
    } = commands[index];
    const sub = executeCommand(
      title,
      command,
      exec,
      options,
      isDefaultBuildCommand,
      context,
    );
    if (sub) {
      context.subscriptions.push(sub);
    }
  }
}

export function deactivate(): void {}

export default { commands };
