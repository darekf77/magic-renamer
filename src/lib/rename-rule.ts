import { Log, Level } from 'ng2-logger/src';
import { Helpers, Utils } from 'tnp-core/src';
import { _, UtilsString } from 'tnp-core/src';
const log = Log.create('magic-renemer');

export class RenameRule {
  static from(pArgs: string): RenameRule[] {
    pArgs = pArgs.replace(/\=\>/g, '->');
    let args = pArgs.split(/(\'|\")(\ )+(\'|\")/).filter(f => !!f) as string[];
    log.d('---- Rules ----');
    args.forEach(a => {
      log.d(a);
    });
    log.d('---------------');
    return args
      .filter(a => a.search('->') !== -1)
      .map(a => {
        const [from, to] = a.split('->');
        if (!from || !to) {
          Helpers.error(
            `Incorrect rule
        "${from}" -> "${to}"
        please follow pattern: 'test name -> my new name '`,
            false,
            true,
          );
        }
        return new RenameRule(from.trim(), to.trim());
      });
  }

  public readonly fromWhiteSpaceReplaced: string;

  public readonly toWhiteSpaceReplaced: string;

  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    this.fromWhiteSpaceReplaced = from.trim().toLowerCase().replace(/\W/g, ' ');
    this.toWhiteSpaceReplaced = to.trim().toLowerCase().replace(/\W/g, ' ');
  }

  applyTo(s: string): boolean {
    s = s.trim().toLowerCase().replace(/\W/g, '');
    const res = s.search(this.from.replace(/\W/g, '')) !== -1;
    return res;
  }

  toString = () => {
    return `${this.from} => ${this.to}`;
  };

  includes(orgString) {
    return !_.isUndefined(
      this.combinationsData(true).combinationsAll.find(v => {
        const [from, to] = v;
        return orgString === to;
      }),
    );
  }

  combinationsData(getAll = false): {
    isWeakFrom: boolean;
    combinationsAll?: string[][];
    combinationsInClass?: string[][];
    combinationsInTemplate?: string[][];
  } {
    const thisTo = this.toWhiteSpaceReplaced;
    const thisFrom = this.fromWhiteSpaceReplaced;

    /**
     * Example: thisFrom === 'entity'; thisTo => 'entity-new'
     * - we are not sure if 'entity' alone should be 'entity-new' or 'entityNew'
     */
    const isWeakFrom = _.kebabCase(thisFrom).split('-').length <= 1;

    if (isWeakFrom && !getAll) {
      return {
        isWeakFrom,
        combinationsInTemplate: [
          [_.upperCase(thisFrom), _.snakeCase(thisTo).toUpperCase()], // ENTITY => HELLO_KITTY
          [
            _.upperFirst(_.camelCase(thisFrom)),
            _.upperFirst(_.camelCase(thisTo)),
          ], // Entity => HelloKitty
          ['"' + _.camelCase(thisFrom) + '.', '"' + _.camelCase(thisTo) + '.'], // entity => helloKitty
          [
            UtilsString.kebabCaseNoSplitNumbers(thisFrom),
            UtilsString.kebabCaseNoSplitNumbers(thisTo),
          ], // entity1 => hello1-kitty
        ],
        combinationsInClass: [
          [
            _.upperFirst(_.camelCase(thisFrom)),
            _.upperFirst(_.camelCase(thisTo)),
          ], // Entity => HelloKitty
          [_.upperCase(thisFrom), _.snakeCase(thisTo).toUpperCase()], // MY ENTITY => HELLO_KITTY
          [_.camelCase(thisFrom), _.camelCase(thisTo)], // entity => helloKitty
        ],
      };
    }
    return {
      isWeakFrom: false,
      combinationsAll: [
        // TODO 'rs.asdasd-asd-A.'
        [
          UtilsString.kebabCaseNoSplitNumbers(thisFrom),
          UtilsString.kebabCaseNoSplitNumbers(thisTo),
        ], // my-entity => hello1-kitty
        [_.kebabCase(thisFrom), _.kebabCase(thisTo)], // my-entity => hello-kitty
        [_.camelCase(thisFrom), _.camelCase(thisTo)], // myEntity => helloKitty
        [
          _.upperFirst(_.camelCase(thisFrom)),
          _.upperFirst(_.camelCase(thisTo)),
        ], // MyEntity => HelloKitty
        [_.snakeCase(thisFrom), _.snakeCase(thisTo)], // my_entity => hello_kitty
        [
          _.snakeCase(thisFrom).toUpperCase(),
          _.snakeCase(thisTo).toUpperCase(),
        ], // MY_ENTITY => HELLO_KITTY
        [_.startCase(thisFrom), _.startCase(thisTo)], // My Entity => Hello Kitty
        [_.upperCase(thisFrom), _.upperCase(thisTo)], // MY ENTITY => HELLO KITTY
        [_.lowerCase(thisFrom), _.lowerCase(thisTo)], // my entity => hello kitty
        [
          _.camelCase(thisFrom).toLocaleLowerCase(),
          _.camelCase(thisTo).toLocaleLowerCase(),
        ], // myentity => hellokitty
      ],
    };
  }

  /**
   * @param orgString input string
   * @returns string with all possible combinations replaced
   */
  replaceInString(orgString: string): string {
    return this.replace({
      orgString,
      replaceAllPossibilities: true,
    });
  }

  /**
   *
   * @param orgString (file name OR file content)
   * @param replaceAllPossibilities when changing file notent (not name only)
   */
  replace(options: {
    /**
     * file name for debugging
     */
    fileName?: string;
    orgString: string;
    replaceAllPossibilities?: boolean;
  }) {
    let { fileName, orgString, replaceAllPossibilities } = options;
    replaceAllPossibilities = !!replaceAllPossibilities;
    const combinationsData = this.combinationsData();
    if (combinationsData.isWeakFrom) {
      const lines = orgString.split('\n');
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        let combinations = combinationsData.combinationsInTemplate;
        if (line.includes('inject(')) {
          // QUICK_FIX for component class variables
          combinations = combinationsData.combinationsInClass;
        }

        for (
          let combinationIndex = 0;
          combinationIndex < combinations.length;
          combinationIndex++
        ) {
          let [from, to] = combinations[combinationIndex];
          // console.log({ from, to });

          lines[lineIndex] = lines[lineIndex].replace(
            new RegExp(Utils.escapeStringForRegEx(from), 'g'),
            to,
          );
        }
      }
      orgString = lines.join('\n');
    } else {
      const combinations = combinationsData.combinationsAll;
      for (
        let combinationIndex = 0;
        combinationIndex < combinations.length;
        combinationIndex++
      ) {
        const combination = combinations[combinationIndex];
        let [from, to] = combination;
        if (orgString.search(from) !== -1) {
          const regex = new RegExp(Utils.escapeStringForRegEx(from));
          log.i(`apply! "${regex.source}" to file ${fileName} => "${to}"`);
          orgString = orgString.replace(
            new RegExp(Utils.escapeStringForRegEx(from), 'g'),
            to,
          );

          if (!replaceAllPossibilities) {
            return orgString;
          }
        }
      }
    }

    return orgString;
  }
}
