import { Helpers } from 'tnp-helpers';
import { _ } from 'tnp-core';
import { Log, Level } from 'ng2-logger';
const log = Log.create('magic-renemer',
  Level.__NOTHING
)


export class RenameRule {

  public readonly fromWhiteSpaceReplaced: string;
  public readonly toWhiteSpaceReplaced: string;
  constructor(
    public readonly from: string,
    public readonly to: string,

  ) {
    this.fromWhiteSpaceReplaced = from.trim().toLowerCase().replace(/\W/g, ' ')
    this.toWhiteSpaceReplaced = to.trim().toLowerCase().replace(/\W/g, ' ')
  }

  applyTo(s: string): boolean {
    s = s.trim().toLowerCase().replace(/\W/g, '')
    const res = (s.search(this.from.replace(/\W/g, '')) !== -1);
    return res;
  }

  toString = () => {
    return `${this.from} => ${this.to}`
  };

  includes(orgString) {
    return !_.isUndefined(this.combinations.find((v) => {
      const [from, to] = v;
      return orgString === to;
    }))
  }

  get combinations() {
    const thisTo = this.toWhiteSpaceReplaced;
    const thisFrom = this.fromWhiteSpaceReplaced;
    return [
      // TODO 'rs.asdasd-asd-A.'
      [_.kebabCase(thisFrom), _.kebabCase(thisTo)],  // my-entity => hello-kitty
      [_.camelCase(thisFrom), _.camelCase(thisTo)],  // myEntity => helloKitty
      [_.upperFirst(_.camelCase(thisFrom)), _.upperFirst(_.camelCase(thisTo))], // MyEntity => HelloKitty
      [_.snakeCase(thisFrom), _.snakeCase(thisTo)],  // my_entity => hello_kitty
      [_.snakeCase(thisFrom).toUpperCase(), _.snakeCase(thisTo).toUpperCase()],  // MY_ENTITY => HELLO_KITTY
      [_.startCase(thisFrom), _.startCase(thisTo)], // My Entity => Hello Kitty
      [_.upperCase(thisFrom), _.upperCase(thisTo)], // MY ENTITY => HELLO KITTY
      [_.lowerCase(thisFrom), _.lowerCase(thisTo)], // my entity => hello kitty
      [_.camelCase(thisFrom).toLocaleLowerCase(), _.camelCase(thisTo).toLocaleLowerCase()], // myentity => hellokitty
    ];
  }

  /**
   *
   * @param orgString (file name OR file content)
   * @param replaceallPossibliliteis when changin file notent (not name only)
   * @returns
   */
  replace(filename: string, orgString: string, replaceallPossibliliteis = false) {

    const combinations = this.combinations;
    for (let index = 0; index < combinations.length; index++) {
      const v = combinations[index];
      let [from, to] = v;
      if (orgString.search(from) !== -1) {
        const regex = new RegExp(Helpers.escapeStringForRegEx(from));
        log.i(`apply! "${regex.source}" to file ${filename} => "${to}"`)
        orgString = orgString.replace(new RegExp(Helpers.escapeStringForRegEx(from), 'g'), to);
        if (!replaceallPossibliliteis) {
          return orgString;
        }
      }
    }
    return orgString;
  }

}
