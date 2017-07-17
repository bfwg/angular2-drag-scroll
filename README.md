# [Angular2 Drag to Scroll](https://bfwg.github.io/angular2-drag-scroll/)

Lightweight drag to scroll directive for Angular2

[![npm version](https://img.shields.io/npm/v/angular2-drag-scroll.svg)](https://www.npmjs.com/package/angular2-drag-scroll)
[![Build Status](https://travis-ci.org/bfwg/angular2-drag-scroll.svg?branch=master)](https://travis-ci.org/bfwg/angular2-drag-scroll)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bfwg/angular2-drag-scroll/blob/master/LICENSE)

*Scroll on drag!*

![Scroll](https://raw.githubusercontent.com/bfwg/angular2-drag-scroll/master/demo/assets/img/Wp03zyitgY.gif)

Try out the [demo](https://bfwg.github.io/angular2-drag-scroll/)!

# Install

You can get it on npm.

```shell
npm install angular2-drag-scroll --save
```

# Setup

You'll need to add `DragScrollModule` to your application module.

```typescript
import { DragScrollModule } from 'angular2-drag-scroll';
...

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    DragScrollModule,
    ...
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule {
}

```
Add the `drag-scroll` attribute to a scrollable element:
```typescript
@Component({
  selector: 'sample',
  template:`
  <div drag-scroll>
    Big text goes here...
  </div>
  `
})
class Sample {}
```
That's it! Now you can scroll it by dragging.

## API REFERENCE

| Name                   | Type    | Description                                                                   |Default|
|------------------------|---------|-------------------------------------------------------------------------------|-------|
| scrollbar-hidden       | @Input  | Whether the scroll bar for this element is hidden.                            | false |
| drag-scroll-disabled   | @Input  | Whether all draging and scrolling events is disabled.                         | false |
| drag-scroll-x-disabled | @Input  | Whether horizontally dragging and scrolling events is disabled.               | false |
| drag-scroll-y-disabled | @Input  | Whether vertically dragging and scrolling events is disabled.                 | false |
| drag-scroll-nav        | @Input  | Whether show the navigation buttons.                                          | false |

___

## Dynamically apply the plugin to a DOM element

This was brought by @tommykamkcm. The below code block demonstrates how to attach the directive dynamically on a DOM i.e. deep rendered element.
```javascript
dragScrollDom: any;
dragScrollRef: ElementRef;
dragScroll: DragScroll;

ngAfterViewInit() {
  // attach to .nav-tabs element
  this.dragScrollDom = this.element.nativeElement.querySelector('.nav-tabs');
  this.dragScrollRef = new ElementRef(this.dragScrollDom );

  this.dragScroll = new DragScroll(this.dragScrollRef, this.renderer);
  this.dragScroll.attach({
    disabled: false,
    scrollbarHidden: true,
    yDisabled: true,
    xDisabled: false,
    nav: false
  });
}
```

# License
 [MIT](/LICENSE)
