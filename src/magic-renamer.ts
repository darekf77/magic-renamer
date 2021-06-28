//#region imports
//#region @backend
import { _, path, fse, glob } from 'tnp-core';
import { Helpers, Project } from 'tnp-helpers';
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
    const nearestProject = Project.nearestTo(cwd);
    if (nearestProject) {
      cwd = nearestProject.location;
    }
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
    Helpers.info('Rebranding of files');

    let options = Helpers.cliTool.argsFrom<{}>(pArgs);
    pArgs = Helpers.cliTool.cleanCommand(pArgs, options);

    let relativePath = _.first(pArgs.split(' '));
    pArgs = pArgs.replace(relativePath, '');
    pArgs = pArgs.replace(/\=\>/g, '->');
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
      Helpers.error(`[magic-renamer] Plase provide rules:

      example:
      <command> 'my-module -> my-new-modules'

      `)
    }

    let folder = path.join(this.cwd, relativePath);
    let originalContent: string;
    if (copyIfFolder) {
      const newRelativePath = path.join(path.dirname(relativePath), `_${path.basename(relativePath)}`);
      originalContent = path.join(this.cwd, newRelativePath);
      Helpers.copy(folder, originalContent);
    }
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
    this.changeContent(files);
    if (originalContent) {
      const orgFolder = path.join(path.dirname(originalContent), path.basename(originalContent).replace(/\_/, ''));
      Helpers.move(originalContent, orgFolder);
    }
  }
  //#endregion

  //#endregion

  //#region private methods
  private changeFiles(files: string[] = [], startProcessAgain: (newFolder: string) => any, isFirstCall = true) {
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
        const dest = path.join(path.dirname(file), r.replace(fileName));
        // Helpers.log(`des ${dest}`);
        Helpers.move(file, dest);
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
    return this.changeFiles(_.cloneDeep(files), startProcessAgain, false);
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
//#endregion
