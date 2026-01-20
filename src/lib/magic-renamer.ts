//#region imports
import * as micromatch from 'micromatch'; // @backend
import { Log, Level } from 'ng2-logger/src';
import {
  _,
  path,
  fse,
  glob,
  crossPlatformPath,
  fg,
  Utils,
  dotTaonFolder,
  dotTnpFolder,
  UtilsFilesFoldersSync,
  UtilsFilesFolders,
} from 'tnp-core/src';
import { Helpers } from 'tnp-core/src';

import { shouldDebug } from './magic-renamer-data';
import { RenameRule } from './rename-rule';

//#endregion
const log = Log.create('magic-renemer', Level.__NOTHING);

export class MagicRenamer {
  //#region @backend

  //#region singleton
  private static _instances = {};

  private constructor(
    private readonly cwd: string,
    private verbose: boolean,
  ) {}

  public static Instance(cwd = process.cwd(), silent = false) {
    cwd = crossPlatformPath(cwd);
    if (!MagicRenamer._instances[cwd]) {
      MagicRenamer._instances[cwd] = new MagicRenamer(cwd, !silent);
    }
    return MagicRenamer._instances[cwd] as MagicRenamer;
  }
  //#endregion

  //#region fields
  rules: RenameRule[] = [];
  //#endregion

  omitPatterns: string[] = UtilsFilesFoldersSync.IGNORE_FOLDERS_FILES_PATTERNS;

  //#region public api

  //#region public api / start
  start(pArgs: string, omitPatterns?: string[]) {
    if (_.isUndefined(omitPatterns)) {
      omitPatterns = UtilsFilesFoldersSync.IGNORE_FOLDERS_FILES_PATTERNS;
    }
    this.omitPatterns = omitPatterns;
    const orgArgs = pArgs;
    this.verbose && Helpers.info('\n\n\nRebranding of files');

    // let options = Helpers.cliTool.argsFrom<{}>(pArgs);
    // pArgs = Helpers.cliTool.cleanCommand(pArgs, options);

    // let relativePath = _.first(pArgs.split(' '));
    // pArgs = pArgs.replace(relativePath, '');
    pArgs = decodeURIComponent(pArgs);

    // console.log({
    //   pArgs
    // })

    this.rules = RenameRule.from(pArgs);

    this.verbose &&
      console.log(`Detected rules (${this.rules.length}):
${this.rules.map(r => r.toString()).join('\n')}`);

    if (this.rules.length === 0) {
      // console.log({
      //   pArgs
      // })
      Helpers.error(`[magic-renamer] Please provide rules:
      example:
      <command> 'my-module -> my-new-modules'
      your args: "${orgArgs}"

      `);
    }

    let folder = this.cwd;
    let files = this.getAllFilesFoldersRecusively(folder); //filter(f => crossPlatformPath(f) === folder)
    this.verbose &&
      Helpers.info(
        `Detecteed files (${files.length}) in folder ${folder}:
${files.map(f => `- ${f.replace(folder, '')}`).join('\n')}`,
      );

    const starCallback = newFolder => {
      if (newFolder) {
        folder = newFolder;
      }
      files = this.getAllFilesFoldersRecusively(folder);
      this.changeFiles(folder, files, starCallback);
    };

    this.changeFiles(folder, files, starCallback);
    files = this.getAllFilesFoldersRecusively(folder, true);
    this.changeContent(files);
    this.verbose && console.log('PROCESS DONE');
  }
  //#endregion

  //#endregion

  //#region private methods
  private changeFiles(
    folder: string,
    files: string[] = [],
    startProcessAgain: (newFolder: string) => any,
    isFirstCall = true,
  ) {
    if (files.length === 0) {
      return;
    }
    let fileAbsPath = files.shift();
    log.d(`Processing file: ${path.basename(fileAbsPath)}`);
    const fileName = path.basename(fileAbsPath);
    for (let index = 0; index < this.rules.length; index++) {
      const rule = this.rules[index];
      // log.d(`Checking rule ${r}`)
      if (rule.applyTo(fileName) && !rule.includes(fileName)) {
        log.d(`Apply to: ${fileName}`);
        const destChangedToNewName = crossPlatformPath([
          path.dirname(fileAbsPath),
          rule.replace({
            fileName,
            orgString: fileName,
            replaceallPossibliliteis: false,
          }),
        ]);
        // console.log(`des ${destChangedToNewName}`);
        if (crossPlatformPath(fileAbsPath) === folder) {
          const filter = src => {
            const exclude = micromatch.isMatch(src, this.omitPatterns, {
              dot: true,
            });
            return !exclude;
            // return !/.*node_modules.*/g.test(src);
          };
          UtilsFilesFoldersSync.copy(fileAbsPath, destChangedToNewName, {
            filter,
          });
        } else {
          if (fileAbsPath !== destChangedToNewName) {
            UtilsFilesFoldersSync.move(fileAbsPath, destChangedToNewName);
          } else {
            console.warn(
              `Trying to move into same dest ${destChangedToNewName}`,
            );
          }
        }
        fileAbsPath = destChangedToNewName;
        if (path.extname(destChangedToNewName) === '') {
          files.length = 0;
          log.d(`Starting process again from: ${destChangedToNewName}`);
          startProcessAgain(isFirstCall ? destChangedToNewName : void 0);
          return false;
        }
      } else {
        log.d(`Not apply to: ${fileName}`);
      }
    }
    return this.changeFiles(
      folder,
      _.cloneDeep(files),
      startProcessAgain,
      false,
    );
  }

  private changeContent(files: string[] = []) {
    if (files.length === 0) {
      return;
    }
    const fileAbsPath = files.shift() || '';
    log.d(`Processing content of file: ${path.basename(fileAbsPath)}`);
    const fileContent = Helpers.readFile(fileAbsPath) || '';

    const rules = this.rules;
    for (let index = 0; index < rules.length; index++) {
      const r = rules[index];
      log.d(`Checking rule ${r}`);
      if (r.applyTo(fileContent)) {
        log.d(`Write file: ${fileAbsPath}`);
        // shouldDebug(fileAbsPath) && console.log(fileContent)
        const replaced = r.replace({
          fileName: fileAbsPath,
          orgString: fileContent,
          replaceallPossibliliteis: true,
        });
        // shouldDebug(fileAbsPath) && console.log(replaced)
        Helpers.writeFile(fileAbsPath, replaced);
      } else {
        log.d(`Not apply to: ${fileAbsPath}`);
      }
    }

    this.changeContent(files);
  }

  private getAllFilesFoldersRecusively(cwdFolder: string, filesOnly?: boolean) {
    filesOnly = !!filesOnly;
    const files = UtilsFilesFoldersSync.getFilesFrom(cwdFolder, {
      recursive: true,
      followSymlinks: false,
      omitPatterns: this.omitPatterns,
    });

    if (filesOnly) {
      return [...files].sort();
    }

    const folders = UtilsFilesFoldersSync.getFoldersFrom(cwdFolder, {
      recursive: true,
      followSymlinks: false,
      omitPatterns: this.omitPatterns,
    });
    return Utils.uniqArray([cwdFolder, ...files, ...folders]).sort();
  }
  //#endregion

  //#endregion
}
