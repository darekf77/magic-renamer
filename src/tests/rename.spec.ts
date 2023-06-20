// import { _ } from 'tnp-core';
import { describe, before, beforeEach, it, } from 'mocha'
import { expect } from 'chai';
import { RenameRule } from '../lib/rename-rule.backend';

const filename = 'testfile'


// const instance = BrowserDB.instance;

describe('Rename rule class', () => {
  let rule: RenameRule;


  beforeEach(function () {
    // runs before each test in this block
    rule = new RenameRule('my-entity', 'hello-kitty');
  });

  it('my-entity => hello-kitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const c - 'my-entity';`, false))
      .to
      .be
      .eq(`const c - 'hello-kitty';`)
  })

  it('myEntity => helloKitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `function myEntity { }`, false))
      .to
      .be
      .eq(`function helloKitty { }`)
  })

  it('MyEntity => HelloKitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `class MyEntity { }`, false))
      .to
      .be
      .eq(`class HelloKitty { }`)
  })

  it('my_entity => hello_kitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const c - 'my_entity';`, false))
      .to
      .be
      .eq(`const c - 'hello_kitty';`)
  })

  it('MY_ENTITY => HELLO_KITTY', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const MY_ENTITY = 0;`, false))
      .to
      .be
      .eq(`const HELLO_KITTY = 0;`)
  })


  it('My Entity => Hello Kitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const str= 'My Entity';`, false))
      .to
      .be
      .eq( `const str= 'Hello Kitty';`);
  })

  it('MY ENTITY => HELLO KITTY', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const str= 'MY ENTITY';`, false))
      .to
      .be
      .eq( `const str= 'HELLO KITTY';`);
  })

  it('my entity => hello kitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const str= 'my entity';`, false))
      .to
      .be
      .eq( `const str= 'hello kitty';`);
  })

  it('myentity => hellokitty', () => {
    // expect(0).to.be.eq(0)
    expect(rule.replace(filename, `const str= 'amyentity';`, false))
      .to
      .be
      .eq( `const str= 'ahellokitty';`);
  })




});

