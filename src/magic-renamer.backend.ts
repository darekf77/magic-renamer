import { _, path, fse, glob } from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import { RenameRule } from './rename-rule';

export class MagicRenamer {
  //#region singleton
  private static _instances = {};
  private constructor(
    private readonly cwd: string
  ) { }
  public static Instance(cwd = process.cwd()) {
    if (!MagicRenamer._instances[cwd]) {
      MagicRenamer._instances[cwd] = new MagicRenamer(cwd);
    }
    return MagicRenamer._instances[cwd] as MagicRenamer;
  }
  //#endregion
  rules: RenameRule[] = [];

  start(pArgs: string) {
    Helpers.info('Rebranding of files');

    const relativePath = _.first(pArgs.split(' '));
    pArgs = pArgs.replace(relativePath, '');
    let args = pArgs.split(/(\'|\")(\ )+(\'|\")/).filter(f => !!f) as string[];
    Helpers.log('---- Rules ----');
    // args.forEach(a => {
    //   Helpers.log(a)
    // });
    Helpers.log('---------------');
    this.rules = args
      .filter(a => a.search('->') !== -1)
      .map(a => {
        const [from, to] = a.split('->')
        if (!from || !to) {
          Helpers.error(`Incorrect rule
        "${from}" -> "${to}"
        please follow pattern: 'test name -> my new name '`, false, true);
        }
        return new RenameRule(from.trim(), to.trim());
      });

    let folder = path.join(this.cwd, relativePath);
    // Helpers.info(folder)
    let files = getAllFilesFoldersRecusively(folder);
    // Helpers.info(`files:\n ${files.map(f => f.replace(folder, '')).join('\n')}`);
    const starCallback = newFolder => {
      if (newFolder) {
        folder = newFolder;
      }
      files = getAllFilesFoldersRecusively(folder);
      this.changeFiles(files, starCallback);
    };
    this.changeFiles(files, starCallback);
    files = getAllFilesFoldersRecusively(folder, true);
    this.changeContent(files)
  }

  changeFiles(files: string[] = [], startProcessAgain: (newFolder: string) => any, isFirstCall = true) {
    if (files.length === 0) {
      return;
    }
    let file = files.shift();
    Helpers.log(`Processing file: ${path.basename(file)}`)
    const fileName = path.basename(file);
    for (let index = 0; index < this.rules.length; index++) {
      const r = this.rules[index];
      // Helpers.log(`Checking rule ${r}`)
      if (r.applyTo(fileName)) {
        // Helpers.log(`Apply to: ${fileName}`);
        const dest = path.join(path.dirname(file), r.replace(fileName));
        // Helpers.log(`des ${dest}`);
        Helpers.move(file, dest);
        file = dest;
        if (path.extname(dest) === '') {
          files.length = 0;
          Helpers.info(`Starting process again from: ${dest}`)
          startProcessAgain(isFirstCall ? dest : void 0);
          return false;
        }

      } else {
        // Helpers.log(`Not apply to: ${fileName}`);
      }
    }
    return this.changeFiles(_.cloneDeep(files), startProcessAgain, false);
  }

  changeContent(files: string[] = []) {
    if (files.length === 0) {
      return;
    }
    const file = files.shift();
    Helpers.log(`Processing content of file: ${path.basename(file)}`)
    const fileContent = Helpers.readFile(file);
    this.rules.forEach(r => {
      // Helpers.log(`Checking rule ${r}`)
      if (r.applyTo(fileContent)) {
        // Helpers.log(`Apply to: ${fileContent}`);
        Helpers.writeFile(file, r.replace(fileContent));
      } else {
        // Helpers.log(`Not apply to: ${fileContent}`);
      }
    });
    this.changeContent(files);
  }
}

function getAllFilesFoldersRecusively(folder: string, filesOnly = false) {
  let files = glob.sync(`${folder}/**/*.*`);
  if (!filesOnly) {
    let dirs = [folder]
    files.forEach(filePath => {
      const p = path.dirname(filePath);
      dirs = dirs.concat(
        fse.readdirSync(p).filter(f => fse.statSync(path.join(p, f)).isDirectory()).map(f => path.join(p, f))
      );
    });
    files = files.concat(dirs);
    files = Helpers.arrays.uniqArray(files);
  }
  return files.sort();
}

