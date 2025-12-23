// @ts-nocheck
//#region @notForNpm

//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-magic-renamer',
  template: 'hello from magic-renamer',
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class MagicRenamerComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}

@NgModule({
  imports: [],
  exports: [MagicRenamerComponent],
  declarations: [MagicRenamerComponent],
  providers: [],
})
export class MagicRenamerModule {}
//#endregion

async function start(port: number) {
  console.log('hello world');
}

export default start;

//#endregion
