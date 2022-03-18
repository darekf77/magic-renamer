import { Helpers, _ } from 'tnp-core';

export class RenameRule {
  //#region fields
  public readonly from: string;
  public readonly to: string;
  org = {
    from: void 0 as string,
    to: void 0 as string,
  }
  //#endregion

  constructor(
    from: string,
    to: string,

  ) {
    this.org.from = from;
    this.org.to = to;
    this.from = from.trim().toLowerCase().replace(/\W/g, ' ')
    this.to = to.trim().toLowerCase().replace(/\W/g, ' ')
  }

  applyTo(s: string): boolean {
    s = s.trim().toLowerCase().replace(/\W/g, '')
    return (s.search(this.from.replace(/\W/g, '')) !== -1);
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
    const thisTo = this.to;
    const thisFrom = this.from;
    return [
      // TODO 'rs.asdasd-asd-A.'
      [_.kebabCase(thisFrom), _.kebabCase(thisTo)],
      [_.camelCase(thisFrom), _.camelCase(thisTo)],
      [_.upperFirst(_.camelCase(thisFrom)), _.upperFirst(_.camelCase(thisTo))],
      [_.lowerFirst(_.camelCase(thisFrom)), _.lowerFirst(_.camelCase(thisTo))],
      [_.snakeCase(thisFrom), _.snakeCase(thisTo)],
      [_.startCase(thisFrom), _.startCase(thisTo)],
      [_.upperCase(thisFrom), _.upperCase(thisTo)],
      [_.lowerCase(thisFrom), _.lowerCase(thisTo)],
    ];
  }

  replace(orgString: string, all = false) {
    if (all) {
      this.combinations.find((v) => {
        let [from, to] = v;
        if (orgString.search(from) !== -1 && orgString.search(to) === -1) {
          orgString = orgString.replace(new RegExp(from, 'g'), to);
        } else {
          from = from.replace(/\s/g, '');
          to = to.replace(/\s/g, '');
          if (orgString.search(from) !== -1 && orgString.search(to) === -1) {
            orgString = orgString.replace(new RegExp(from, 'g'), to);
          }
        }
      });
      return orgString;
    }

    const founded = this.combinations.find((v) => {
      let [from, to] = v;
      // console.log(`${from} => ${to}`)
      if (orgString.search(from) !== -1) {
        orgString = orgString.replace(new RegExp(from, 'g'), to);
        return true;
      }
      from = from.replace(/\s/g, '');
      to = to.replace(/\s/g, '');
      // console.log(`${from} => ${to}`)
      if (orgString.search(from) !== -1) {
        orgString = orgString.replace(new RegExp(from, 'g'), to);
        return true;
      }
      return false;
    });
    if (_.isUndefined(founded)) {
      Helpers.log(`[magic-renamer][magic-rule][replace] not match for ${orgString}`);
    } else {
      Helpers.log(`[magic-renamer][magic-rule][replace] match on "${founded.toString()}" for ${orgString}`);
    }
    return orgString;
  }

}
