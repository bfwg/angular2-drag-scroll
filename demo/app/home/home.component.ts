import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MdIconRegistry } from '@angular/material';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  viewProviders: [MdIconRegistry]
})
export class HomeComponent implements OnInit {
  title = 'app works!';
  hideScrollbar;
  disabled;
  xDisabled;
  yDisabled;
  imagelist = [
    'luke.png',
    'chubaka.png',
    'boba.png',
    'c3po.png' ,
    'leia.png',
    'obi.png',
    'r2d2.png',
    'storm.png',
    'varder.png',
    'yoda.png',
    'yolo.png'
  ];
  constructor(mdIconRegistry: MdIconRegistry, sanitizer: DomSanitizer) {
    mdIconRegistry
        .addSvgIcon('github',
            sanitizer.bypassSecurityTrustResourceUrl('/assets/img/github.svg'))
        .registerFontClassAlias('fontawesome', 'fa');
  }

  ngOnInit() {
  }

  remove() {
    this.imagelist.pop();
  }

  toggleHideSB() {
    this.hideScrollbar = !this.hideScrollbar;
  }

  toggleDisable() {
    this.disabled = !this.disabled;
  }
  toggleXDisable() {
    this.xDisabled = !this.xDisabled;
  }
  toggleYDisable() {
    this.yDisabled = !this.yDisabled;
  }
}
