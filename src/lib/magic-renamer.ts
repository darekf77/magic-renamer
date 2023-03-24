//#region imports
//#region @backend
import { _, path, fse, glob, crossPlatformPath } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { RenameRule } from './rename-rule.backend';
//#endregion
//#endregion

export class MagicRenamer {
  //#region @backend

  //#region singleton
  private static _instances = {};
  private constructor(
    private readonly cwd: string
  ) { }
  public static Instance(cwd = process.cwd()) {
    cwd = crossPlatformPath(cwd);
    if (!MagicRenamer._instances[cwd]) {
      MagicRenamer._instances[cwd] = new MagicRenamer(cwd);
    }
    return MagicRenamer._instances[cwd] as MagicRenamer;
  }
  //#endregion

  //#region fields
  readonly rules: RenameRule[] = [];
  //#endregion

  //#region public api

  //#region public api / start
  start(pArgs: string, copyIfFolder = false) {
    const orgArgs = pArgs;
    Helpers.info('Rebranding of files');

    // let options = Helpers.cliTool.argsFrom<{}>(pArgs);
    // pArgs = Helpers.cliTool.cleanCommand(pArgs, options);

    // let relativePath = _.first(pArgs.split(' '));
    // pArgs = pArgs.replace(relativePath, '');
    pArgs = decodeURIComponent(pArgs).replace(/\=\>/g, '->');
    let args = pArgs.split(/(\'|\")(\ )+(\'|\")/).filter(f => !!f) as string[];
    Helpers.log('---- Rules ----');
    args.forEach(a => {
      Helpers.log(a)
    });
    Helpers.log('---------------');
    args
      .filter(a => a.search('->') !== -1)
      .map(a => {
        const [from, to] = a.split('->')
        if (!from || !to) {
          Helpers.error(`Incorrect rule
        "${from}" -> "${to}"
        please follow pattern: 'test name -> my new name '`, false, true);
        }
        return new RenameRule(from.trim(), to.trim());
      })
      .forEach(rule => {
        this.rules.push(rule)
      });

    if (this.rules.length === 0) {
      // console.log({
      //   pArgs
      // })
      Helpers.error(`[magic-renamer] Please provide rules:
      example:
      <command> 'my-module -> my-new-modules'
      your args: "${orgArgs}"

      `)
    }

    // relativePath = crossPlatformPath(relativePath);
    let folder = this.cwd;
    // let originalContent: string;
    // if (copyIfFolder) {
    // const newFolder = crossPlatformPath(path.join(
    //   path.dirname(this.cwd),
    //   `_${path.basename(this.cwd)}`,
    // ));
    // Helpers.copy(folder, newFolder);
    // folder = newFolder;
    // }
    // Helpers.info(folder)
    let files = getAllFilesFoldersRecusively(folder); //filter(f => crossPlatformPath(f) === folder)
    // Helpers.info(`files:\n ${files.map(f => f.replace(folder, '')).join('\n')}`);
    const starCallback = newFolder => {
      if (newFolder) {
        folder = newFolder;
      }
      files = getAllFilesFoldersRecusively(folder);
      this.changeFiles(folder, files, starCallback);
    };
    this.changeFiles(folder, files, starCallback);
    files = getAllFilesFoldersRecusively(folder, true);
    this.changeContent(files);
    // if (originalContent) {
    //   const orgFolder = crossPlatformPath(path.join(
    //     crossPlatformPath(path.dirname(originalContent)),
    //     crossPlatformPath(path.basename(originalContent)).replace(/\_/, ''),
    //   ));
    //   Helpers.move(originalContent, orgFolder);
    // }
  }
  //#endregion

  //#endregion

  //#region private methods
  private changeFiles(folder: string, files: string[] = [], startProcessAgain: (newFolder: string) => any, isFirstCall = true) {
    if (files.length === 0) {
      return;
    }
    let file = files.shift();
    // Helpers.log(`Processing file: ${path.basename(file)}`)
    const fileName = path.basename(file);
    for (let index = 0; index < this.rules.length; index++) {
      const r = this.rules[index];
      // Helpers.log(`Checking rule ${r}`)
      if (r.applyTo(fileName) && !r.includes(fileName)) {
        // Helpers.log(`Apply to: ${fileName}`);
        const dest = crossPlatformPath(path.join(
          path.dirname(file),
          r.replace(fileName)),
        );
        // Helpers.log(`des ${dest}`);
        if (crossPlatformPath(file) === folder) {
          Helpers.copy(file, dest);
        } else {
          Helpers.move(file, dest);
        }
        file = dest;
        if (path.extname(dest) === '') {
          files.length = 0;
          // Helpers.info(`Starting process again from: ${dest}`)
          startProcessAgain(isFirstCall ? dest : void 0);
          return false;
        }

      } else {
        // Helpers.log(`Not apply to: ${fileName}`);
      }
    }
    return this.changeFiles(folder, _.cloneDeep(files), startProcessAgain, false);
  }

  private changeContent(files: string[] = []) {
    if (files.length === 0) {
      return;
    }
    const file = files.shift();
    // Helpers.log(`Processing content of file: ${path.basename(file)}`)
    const fileContent = Helpers.readFile(file);
    this.rules.forEach(r => {
      Helpers.log(`Checking rule ${r}`)
      if (r.applyTo(fileContent)) {
        Helpers.log(`Apply to: ${fileContent}`);
        Helpers.writeFile(file, r.replace(fileContent, true));
      } else {
        Helpers.log(`Not apply to: ${fileContent}`);
      }
    });
    this.changeContent(files);
  }
  //#endregion

  //#endregion
}

//#region @backend
function getAllFilesFoldersRecusively(folder: string, filesOnly = false) {
  let files = glob.sync(`${folder}/**/*.*`);
  if (!filesOnly) {
    let dirs = [folder]
    files.forEach(filePath => {
      const p = crossPlatformPath(path.dirname(filePath));
      dirs = dirs.concat(
        fse.readdirSync(p)
          .filter(f => fse.statSync(crossPlatformPath(path.join(p, f))).isDirectory())
          .map(f => crossPlatformPath(path.join(p, f)))
      );
    });
    files = files.concat(dirs);
    files = Helpers.arrays.uniqArray(files);
  }
  return files.sort();
}
//#endregion
