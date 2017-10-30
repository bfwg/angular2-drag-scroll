import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  QueryList,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';

import { DragScrollOption } from './interface/drag-scroll-option';
import { DragScrollItem } from './drag-scroll-item';
import { DeviceService } from './device-info';


@Component({
  selector: 'drag-scroll, [dragScroll]',
  templateUrl: './drag-scroll.html',
  styles: [`
    :host {
      display: block;
    }
    .drag-scroll-content {
      overflow: hidden;
      white-space: nowrap;
    }
  `]
})
export class DragScroll implements OnDestroy, OnInit, OnChanges, AfterViewInit, AfterViewChecked {

  private _deviceInfo: any;

  private _scrollbarHidden: boolean;

  private _disabled: boolean;

  private _xDisabled: boolean;

  private _yDisabled: boolean;

  private _dragDisabled: boolean;

  /**
   * Is the user currently pressing the element
   */
  isPressed = false;

  /**
   * Is the user currently scrolling the element
   */
  isScrolling = false;

  scrollTimer: number;

  scrollToTimer: number;

  /**
   * The x coordinates on the element
   */
  downX = 0;

  /**
   * The y coordinates on the element
   */
  downY = 0;

  displayType = 'block';

  elWidth: string;

  elHeight: string;

  parentNode: HTMLElement;

  wrapper: HTMLDivElement;

  scrollbarWidth: string;

  onMouseMoveHandler = this.onMouseMove.bind(this);
  onMouseDownHandler = this.onMouseDown.bind(this);
  onScrollHandler = this.onScroll.bind(this);
  onMouseUpHandler = this.onMouseUp.bind(this);

  mouseMoveListener: Function;
  mouseDownListener: Function;
  scrollListener: Function;
  mouseUpListener: Function;

  currIndex = 0;

  isAnimating = false;

  scrollReachesLeftEnd = true;

  scrollReachesRightEnd = false;

  prevChildrenLength = 0;

  /**
   * TODO: JOE
   */
  @ViewChild('contentRef') _contentRef: ElementRef;

  @ContentChildren(DragScrollItem) children: QueryList<DragScrollItem>;


  @Output() leftBound = new EventEmitter<boolean>();
  @Output() rightBound = new EventEmitter<boolean>();

  /**
   * Whether the scrollbar is hidden
   */
  @Input('scrollbar-hidden')
  get scrollbarHidden() { return this._scrollbarHidden; }
  set scrollbarHidden(value: boolean) { this._scrollbarHidden = value; };

  /**
   * Whether horizontally and vertically draging and scrolling is be disabled
   */
  @Input('drag-scroll-disabled')
  get disabled() { return this._disabled; }
  set disabled(value: boolean) { this._disabled = value; };

  /**
   * Whether horizontally dragging and scrolling is be disabled
   */
  @Input('drag-scroll-x-disabled')
  get xDisabled() { return this._xDisabled; }
  set xDisabled(value: boolean) { this._xDisabled = value; };

  /**
   * Whether vertically dragging and scrolling events is disabled
   */
  @Input('drag-scroll-y-disabled')
  get yDisabled() { return this._yDisabled; }
  set yDisabled(value: boolean) { this._yDisabled = value; };

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.markElDimension();
    this.resetScrollLocation();
  }

  @Input('drag-disabled')
  get dragDisabled() { return this._dragDisabled; }
  set dragDisabled(value: boolean) { this._dragDisabled = value; };

  constructor(
    private _elementRef: ElementRef,
    private _renderer: Renderer2,
    private _deviceService: DeviceService,
    @Inject(PLATFORM_ID) private _platformId: Object) {

    this._deviceInfo = _deviceService.getDeviceInfo();
    const scrollbarWidth = {
      mac: {
        'chrome': '15px',
        'safari': '15px',
        'firefox': '15px',
      },
      windows: {
        'chrome': '17px',
        'firefox': '17px',
        'ie': '17px',
        'ms-edge': '12px',
      },
      linux: {
        'chrome': '15px',
        'firefox': '15px',
      }
    };
    this.scrollbarWidth = scrollbarWidth[this._deviceInfo.os][this._deviceInfo.browser] || `${this.getScrollbarWidth()}px`;
  }

  public attach({disabled, scrollbarHidden, yDisabled, xDisabled}: DragScrollOption): void {
    this.disabled = disabled;
    this.scrollbarHidden = scrollbarHidden;
    this.yDisabled = yDisabled;
    this.xDisabled = xDisabled;
    this.ngOnChanges();
  }

  ngOnChanges() {
    this.setScrollBar();
    this.resetScrollLocation();

    if (this.xDisabled || this.disabled) {
      this.disableScroll('x');
    } else {
      this.enableScroll('x');
    }

    if (this.yDisabled || this.disabled) {
      this.disableScroll('y');
    } else {
      this.enableScroll('y');
    }

  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this._renderer.setAttribute(this._elementRef.nativeElement, 'drag-scroll', 'true');

    if (isPlatformBrowser(this._platformId)) {
      // auto assign computed css
      this.displayType = window.getComputedStyle(this._contentRef.nativeElement).display;
    }
    this._renderer.setStyle(this._contentRef.nativeElement, 'display', this.displayType);
    // this._renderer.setStyle(this._contentRef.nativeElement, 'overflow', 'auto');
    this._renderer.setStyle(this._contentRef.nativeElement, 'whiteSpace', 'noWrap');

    // store ele width height for later user
    this.markElDimension();

    // set content element the same height as the component
    this._renderer.setStyle(this._contentRef.nativeElement, 'height', this.elHeight);

    this.mouseDownListener = this._renderer.listen(this._contentRef.nativeElement, 'mousedown', this.onMouseDownHandler);
    this.scrollListener = this._renderer.listen(this._contentRef.nativeElement, 'scroll', this.onScrollHandler);
    this.mouseMoveListener = this._renderer.listen('document', 'mousemove', this.onMouseMoveHandler);
    this.mouseUpListener = this._renderer.listen('document', 'mouseup', this.onMouseUpHandler);

    if (this.wrapper) {
      this.checkScrollbar();
    }

    // fix: Expression has changed after it was checked. Previous value: 'false'. Current value: 'true'.
    setTimeout(() => {
      this.setNavStatus();
    }, 100);
  }

  ngAfterViewChecked() {
    // avoid extra checks
    if (this.children.length !== this.prevChildrenLength) {
      if (this.wrapper) {
        this.checkScrollbar();
      }
      this.prevChildrenLength = this.children.length;
      // fix: Expression has changed after it was checked. Previous value: 'false'. Current value: 'true'.
      setTimeout(() => {
        this.setNavStatus();
      }, 100);
    }
  }

  ngOnDestroy() {
    this._renderer.setAttribute(this._elementRef.nativeElement, 'drag-scroll', 'false');
    this.mouseMoveListener();
    this.mouseUpListener();
  }

  onMouseMove(e: MouseEvent) {
    if (this.isPressed && !this.disabled && e.which !== 2) {
      e.preventDefault();
      // Drag X
      if (!this.xDisabled && !this.dragDisabled) {
        this._contentRef.nativeElement.scrollLeft =
          this._contentRef.nativeElement.scrollLeft - e.clientX + this.downX;
        this.downX = e.clientX;
      }

      // Drag Y
      if (!this.yDisabled && !this.dragDisabled) {
        this._contentRef.nativeElement.scrollTop =
          this._contentRef.nativeElement.scrollTop - e.clientY + this.downY;
        this.downY = e.clientY;
      }
    }
    return false;
  }


  onMouseDown(e: MouseEvent) {
    this.isPressed = true;
    this.downX = e.clientX;
    this.downY = e.clientY;
    clearTimeout(this.scrollToTimer);
  }

  onScroll() {
    // const ele = this._elementRef.nativeElement;
    const contentElement = this._contentRef.nativeElement;
    if ((contentElement.scrollLeft + contentElement.offsetWidth) >= contentElement.scrollWidth) {
      this.scrollReachesRightEnd = true;
      this.setNavStatus();
    } else if (this.scrollReachesRightEnd) {
      this.scrollReachesRightEnd = false;
      this.setNavStatus();
    }

    if (contentElement.scrollLeft === 0 &&
      contentElement.scrollWidth > contentElement.clientWidth) {
      this.scrollReachesLeftEnd = true;
      this.setNavStatus();
    } else if (this.scrollReachesLeftEnd) {
      this.scrollReachesLeftEnd = false;
      this.setNavStatus();
    }

    if (!this.isPressed && !this.isAnimating) {
      this.isScrolling = true;
      clearTimeout(this.scrollTimer);
      this.scrollTimer = window.setTimeout(() => {
        this.isScrolling = false;
        this.snapToCurrentIndex();
      }, 500);
    }
  }

  onMouseUp(e: MouseEvent) {
    e.preventDefault();
    if (this.isPressed) {
      this.isPressed = false;
      this.snapToCurrentIndex();
    }
    return false;
  }

  private disableScroll(axis: string): void {
    this._renderer.setStyle(this._contentRef.nativeElement, `overflow-${axis}`, 'hidden');
  }

  private enableScroll(axis: string): void {
    this._renderer.setStyle(this._contentRef.nativeElement, `overflow-${axis}`, 'auto');
  }

  /**
   * TODO: JOE
   */
  private hideScrollbar(): void {
    if (isPlatformServer(this._platformId) || this._elementRef.nativeElement.style.display !== 'none' && !this.wrapper) {

      // create container element
      this.wrapper = this._renderer.createElement('div');
      this._renderer.addClass(this.wrapper, 'drag-scroll-container');

      this._renderer.setStyle(this.wrapper, 'width', '100%');
      if (isPlatformBrowser(this._platformId)) {
        this._renderer.setStyle(this.wrapper, 'height', this._elementRef.nativeElement.style.height
          || this._elementRef.nativeElement.offsetHeight + 'px');
      }
      this._renderer.setStyle(this.wrapper, 'overflow', 'hidden');

      this._renderer.setStyle(this._contentRef.nativeElement, 'width', `calc(100% + ${this.scrollbarWidth})`);
      this._renderer.setStyle(this._contentRef.nativeElement, 'height', `calc(100% + ${this.scrollbarWidth})`);

      // Append container element to component element.
      this._renderer.appendChild(this._elementRef.nativeElement, this.wrapper);

      // Append content element to container element.
      this._renderer.appendChild(this.wrapper, this._contentRef.nativeElement);
    }
  }

  private showScrollbar(): void {
    if (this.wrapper) {

      this._renderer.setStyle(this._contentRef.nativeElement, 'width', '100%');
      this._renderer.setStyle(this._contentRef.nativeElement, 'height', this.wrapper.style.height);

      // Append content element to component element.
      this._renderer.appendChild(this._elementRef.nativeElement, this._contentRef.nativeElement);

      // remove container element.
      this._renderer.removeChild(this._elementRef.nativeElement, this.wrapper);

      this.wrapper = null;
    }
  }

  private checkScrollbar() {
    if (this._contentRef.nativeElement.scrollWidth <= this._contentRef.nativeElement.clientWidth) {
      this._renderer.setStyle(this._contentRef.nativeElement, 'height', '100%');
    } else {
      this._renderer.setStyle(this._contentRef.nativeElement, 'height', `calc(100% + ${this.scrollbarWidth})`);
    }
    if (this._contentRef.nativeElement.scrollHeight <= this._contentRef.nativeElement.clientHeight) {
      this._renderer.setStyle(this._contentRef.nativeElement, 'width', '100%');
    } else {
      if (this.children.length) {
        // this._renderer.setStyle(this.children.last._elementRef.nativeElement, 'padding-right', this.scrollbarWidth);
      }
      this._renderer.setStyle(this._contentRef.nativeElement, 'width', `calc(100% + ${this.scrollbarWidth})`);
    }
  }

  private setScrollBar(): void {
    if (this.scrollbarHidden) {
      this.hideScrollbar();
    } else {
      this.showScrollbar();
    }
  }

  private getScrollbarWidth(): number {
    // Return 0 is platform is server.
    if (isPlatformServer(this._platformId)) {
      return 0;
    }


    /**
     * Browser Scrollbar Widths (2016)
     * OSX (Chrome, Safari, Firefox) - 15px
     * Windows XP (IE7, Chrome, Firefox) - 17px
     * Windows 7 (IE10, IE11, Chrome, Firefox) - 17px
     * Windows 8.1 (IE11, Chrome, Firefox) - 17px
     * Windows 10 (IE11, Chrome, Firefox) - 17px
     * Windows 10 (Edge 12/13) - 12px
     */


    const outer = this._renderer.createElement('div');
    this._renderer.setStyle(outer, 'visibility', 'hidden');
    this._renderer.setStyle(outer, 'width', '100px');
    this._renderer.setStyle(outer, 'msOverflowStyle', 'scrollbar');  // needed for WinJS apps

    // document.body.appendChild(outer);
    this._renderer.appendChild(document.body, outer);
    // this._renderer.appendChild(this._renderer.selectRootElement('body'), outer);

    const widthNoScroll = outer.offsetWidth;
    // force scrollbars
    this._renderer.setStyle(outer, 'overflow', 'scroll');

    // add innerdiv
    const inner = this._renderer.createElement('div');
    this._renderer.setStyle(inner, 'width', '100%');
    this._renderer.appendChild(outer, inner);

    const widthWithScroll = inner.offsetWidth;

    // remove divs
    this._renderer.removeChild(document.body, outer);

    /**
     * Scrollbar width will be 0 on Mac OS with the
     * default "Only show scrollbars when scrolling" setting (Yosemite and up).
     * setting default width to 20;
     */
    return widthNoScroll - widthWithScroll || 20;
  }


  /*
   * Nav button
   */
  moveLeft() {
    const childrenArray = this.children['_results'];
    const contentElement = this._contentRef.nativeElement;
    if (this.currIndex !== 0 && this.children.length !== 0 && this.children['_results'][this.currIndex].enabled === true) {
      // reach left most
      this.currIndex--;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(contentElement, this.toChildrenLocation(), 500);
    } else if (this.currIndex !== 0 && this.children.length !== 0 && this.children['_results'][this.currIndex].enabled === false) {
      this.currIndex--;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(contentElement, this.toChildrenLocation(), 500);
    } else if (this.children.length === 0) {
      this.currIndex--;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(contentElement, this._contentRef.nativeElement.scrollLeft - 200, 500);
    }
  }

  moveRight() {
    const childrenArray = this.children['_results'];
    const contentElement = this._contentRef.nativeElement;
    if (!this.scrollReachesRightEnd && this.children.length !== 0 && childrenArray[this.currIndex + 1]
      && this.children['_results'][this.currIndex].enabled === true) {
      this.currIndex++;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(contentElement, this.toChildrenLocation(), 500);
    } else if (!this.scrollReachesRightEnd && this.children.length !== 0 && childrenArray[this.currIndex + 1]
      && this.children['_results'][this.currIndex].enabled === false) {
      this.currIndex++;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(contentElement, this.toChildrenLocation(), 500);
    } else if (this.children.length === 0) {
      this.currIndex++;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(contentElement, this._contentRef.nativeElement.scrollLeft + 200, 500);
    }
  }

  moveTo(index: number) {
    if (this.children) {
      const childrenArray = this.children['_results'];
      const contentElement = this._contentRef.nativeElement;
      if (index >= 0 && index !== this.currIndex && childrenArray[index]) {
        this.currIndex = index;
        clearTimeout(this.scrollToTimer);
        this.scrollTo(contentElement, this.toChildrenLocation(), 500);
      }
    }
  }

  /*
  * The below solution is heavily inspired from
  * https://gist.github.com/andjosh/6764939
  */
  private scrollTo(element: Element, to: number, duration: number) {
    this.isAnimating = true;

    const self = this,
      start = element.scrollLeft,
      change = to - start,
      increment = 20;
    let currentTime = 0;

    const animateScroll = function() {
      currentTime += increment;

      element.scrollLeft = self.easeInOutQuad(currentTime, start, change, duration);
      if (currentTime < duration) {
        self.scrollToTimer = window.setTimeout(animateScroll, increment);
      } else {
        // run one more frame to make sure the animation is fully finished
        setTimeout(() => {
          self.isAnimating = false;
        }, increment);
      }
    };

    animateScroll();
  }

  private easeInOutQuad(currentTime: number, startValue: number, changeInValue: number, duration: number): number {
    currentTime /= duration / 2;
    if (currentTime < 1) {
      return changeInValue / 2 * currentTime * currentTime + startValue;
    }
    currentTime--;
    return -changeInValue / 2 * (currentTime * (currentTime - 2) - 1) + startValue;
  }

  private snapToCurrentIndex() {

    // Prevent scroll snap if disabled.
    if (this.children.length === 0 ||
      this.currIndex > this.children.length ||
      !this.children['_results'][this.currIndex] ||
      this.children.length === 1 && this.children['_results'][this.currIndex].enabled ||
      this.children.length !== 0 && !this.children['_results'][this.currIndex].enabled) {
      return;
    }

    let childrenWidth = 0;
    const childrenArray = this.children['_results'];
    const contentElement = this._contentRef.nativeElement;

    for (let i = 0; i < childrenArray.length; i++) {
      if (i === childrenArray.length - 1) {
        this.currIndex = childrenArray.length;
        break;
      }

      const nextChildrenWidth = childrenWidth + childrenArray[i + 1]._elementRef.nativeElement.clientWidth;

      const currentChildWidth = childrenArray[i]._elementRef.nativeElement.clientWidth;
      const nextChildWidth = childrenArray[i + 1]._elementRef.nativeElement.clientWidth;

      if (contentElement.scrollLeft >= childrenWidth &&
        contentElement.scrollLeft <= nextChildrenWidth) {

        if (nextChildrenWidth - contentElement.scrollLeft > currentChildWidth / 2 && !this.scrollReachesRightEnd) {
          // roll back scrolling
          this.currIndex = i;
          this.scrollTo(contentElement, childrenWidth, 500);
        } else {
          // forward scrolling
          this.currIndex = i + 1;
          this.scrollTo(contentElement, childrenWidth + currentChildWidth, 500);
        }
        break;
      }
      childrenWidth += childrenArray[i]._elementRef.nativeElement.clientWidth;
    }
  }

  private toChildrenLocation(): number {
    const childrenArray = this.children['_results'];
    let to = 0;
    for (let i = 0; i < this.currIndex; i++) {
      to += childrenArray[this.currIndex]._elementRef.nativeElement.clientWidth;
    }
    return to;
  }

  /**
   * TODO: Optimization
   * - Stop setNavStatus() getting called every time scrollTo is called, only once scroll transition has finished.
   */
  public setNavStatus() {
    const contentElement = this._contentRef.nativeElement;
    const childrenArray = this.children['_results'];
    if (childrenArray.length <= 1 || contentElement.scrollWidth <= contentElement.clientWidth) {
      // only one element
      this.leftBound.emit(true);
      this.rightBound.emit(true);
    } else if (this.scrollReachesRightEnd) {
      // reached right end
      this.leftBound.emit(false);
      this.rightBound.emit(true);
    } else if (this.scrollReachesLeftEnd) {
      // reached left end
      this.leftBound.emit(true);
      this.rightBound.emit(false);
    } else {
      // in the middle
      this.leftBound.emit(false);
      this.rightBound.emit(false);
    }
  }

  private resetScrollLocation() {
    this.scrollTo(this._contentRef.nativeElement, 0, 0);
    this.currIndex = 0;
  }

  private markElDimension() {
    if (isPlatformBrowser(this._platformId)) {
      if (this.wrapper) {
        this.elWidth = this.wrapper.style.width;
        this.elHeight = this.wrapper.style.height;
      } else {
        this.elWidth = this._elementRef.nativeElement.style.width || this._elementRef.nativeElement.offsetWidth + 'px';
        this.elHeight = this._elementRef.nativeElement.style.height || this._elementRef.nativeElement.offsetHeight + 'px';
      }
    }
  }

}
