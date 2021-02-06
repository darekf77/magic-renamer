import * as _ from 'lodash';

export class RenameRule {
  public from: string;
  public to: string;
  org = {
    from: void 0 as string,
    to: void 0 as string,
  }

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

  replace(orgString: string) {

    const thisTo = this.to;
    const thisFrom = this.from;

    [
      // TODO 'rs.asdasd-asd-A.'
      [_.kebabCase(thisFrom), _.kebabCase(thisTo)],
      [_.camelCase(thisFrom), _.camelCase(thisTo)],
      [_.upperFirst(_.camelCase(thisFrom)), _.upperFirst(_.camelCase(thisTo))],
      [_.snakeCase(thisFrom), _.snakeCase(thisTo)],
      [_.startCase(thisFrom), _.startCase(thisTo)],
      [_.upperCase(thisFrom), _.upperCase(thisTo)],
      [_.lowerCase(thisFrom), _.lowerCase(thisTo)],
    ].forEach((v) => {
      let [from, to] = v;
      // console.log(`${from} => ${to}`)
      orgString = orgString.replace(new RegExp(from, 'g'), to);
      from = from.replace(/\s/g, '');
      to = to.replace(/\s/g, '');
      // console.log(`${from} => ${to}`)
      orgString = orgString.replace(new RegExp(from, 'g'), to);
    });

    return orgString;
  }

}
