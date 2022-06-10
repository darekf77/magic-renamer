//#region @notForNpm

// @browserLine
    import { NgModule } from '@angular/core';
// @browserLine
    import { Component, OnInit } from '@angular/core';

//#region @browser
    @Component({
      selector: 'app-magic-renamer',
      template: 'hello from magic-renamer'
    })
    export class MagicRenamerComponent implements OnInit {
      constructor() { }

      ngOnInit() { }
    }

    @NgModule({
      imports: [],
      exports: [MagicRenamerComponent],
      declarations: [MagicRenamerComponent],
      providers: [],
    })
    export class MagicRenamerModule { }
    //#endregion

    //#region @backend
    async function start(port: number) {
      console.log('hello world from backend');
    }

    export default start;

//#endregion

//#endregion