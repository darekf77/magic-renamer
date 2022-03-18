//#region @notForNpm
//#region @browser
    import { NgModule } from '@angular/core';
    import { Component, OnInit } from '@angular/core';

    @Component({
      selector: 'app-magic-renamer',
      template: 'hello from magic-renamer'
    })
    export class $ { componentName } implements OnInit {
      constructor() { }

      ngOnInit() { }
    }

    @NgModule({
      imports: [],
      exports: [MagicRenamerComponent],
      declarations: [MagicRenamerComponent],
      providers: [],
    })
    export class $ { moduleName } { }
    //#endregion

    //#region @backend
    async function start(port: number) {

    }

    export default start;

//#endregion

//#endregion