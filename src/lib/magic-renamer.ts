//#region imports
import { Log, Level } from 'ng2-logger';
const log = Log.create('magic-renemer',
  Level.__NOTHING
)


//#region @backend
import { _, path, fse, glob, crossPlatformPath } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { shouldDebug } from './magic-renamer-data';
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
    Helpers.info('\n\n\nRebranding of files');

    // let options = Helpers.cliTool.argsFrom<{}>(pArgs);
    // pArgs = Helpers.cliTool.cleanCommand(pArgs, options);

    // let relativePath = _.first(pArgs.split(' '));
    // pArgs = pArgs.replace(relativePath, '');
    pArgs = decodeURIComponent(pArgs).replace(/\=\>/g, '->');
    let args = pArgs.split(/(\'|\")(\ )+(\'|\")/).filter(f => !!f) as string[];
    log.d('---- Rules ----');
    args.forEach(a => {
      log.d(a)
    });
    log.d('---------------');
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

    let folder = this.cwd;
    let files = getAllFilesFoldersRecusively(folder); //filter(f => crossPlatformPath(f) === folder)
    Helpers.info(`files:\n ${files.map(f => f.replace(folder, '')).join('\n')}`);

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
    console.log('PROCESS DONE')
  }
  //#endregion

  //#endregion

  //#region private methods
  private changeFiles(folder: string, files: string[] = [], startProcessAgain: (newFolder: string) => any, isFirstCall = true) {
    if (files.length === 0) {
      return;
    }
    let fileAbsPath = files.shift();
    log.d(`Processing file: ${path.basename(fileAbsPath)}`)
    const fileName = path.basename(fileAbsPath);
    for (let index = 0; index < this.rules.length; index++) {
      const r = this.rules[index];
      // log.d(`Checking rule ${r}`)
      if (r.applyTo(fileName) && !r.includes(fileName)) {
        log.d(`Apply to: ${fileName}`);
        const destChangedToNewName = crossPlatformPath(path.join(
          path.dirname(fileAbsPath),
          r.replace(fileName, fileName)),
        );
        // console.log(`des ${destChangedToNewName}`);
        if (crossPlatformPath(fileAbsPath) === folder) {
          Helpers.copy(fileAbsPath, destChangedToNewName);
        } else {
          if (fileAbsPath !== destChangedToNewName) {
            Helpers.move(fileAbsPath, destChangedToNewName);
          } else {
            console.warn(`Trying to move into same dest ${destChangedToNewName}`);
          }
        }
        fileAbsPath = destChangedToNewName;
        if (path.extname(destChangedToNewName) === '') {
          files.length = 0;
          log.d(`Starting process again from: ${destChangedToNewName}`)
          startProcessAgain(isFirstCall ? destChangedToNewName : void 0);
          return false;
        }

      } else {
        log.d(`Not apply to: ${fileName}`);
      }
    }
    return this.changeFiles(folder, _.cloneDeep(files), startProcessAgain, false);
  }

  private changeContent(files: string[] = []) {
    if (files.length === 0) {
      return;
    }
    const fileAbsPath = files.shift() || '';
    log.d(`Processing content of file: ${path.basename(fileAbsPath)}`)
    const fileContent = Helpers.readFile(fileAbsPath) || '';

    const rules = this.rules;
    for (let index = 0; index < rules.length; index++) {
      const r = rules[index];
      log.d(`Checking rule ${r}`)
      if (r.applyTo(fileContent)) {
        log.d(`Write file: ${fileAbsPath}`);
        // shouldDebug(fileAbsPath) && console.log(fileContent)
        const replaced = r.replace(fileAbsPath, fileContent, true);
        // shouldDebug(fileAbsPath) && console.log(replaced)
        Helpers.writeFile(fileAbsPath, replaced);
      } else {
        log.d(`Not apply to: ${fileAbsPath}`);
      }
    }

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
