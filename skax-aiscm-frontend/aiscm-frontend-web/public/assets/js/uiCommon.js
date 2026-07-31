
// ==================================================
// 페이지 로드 후 실행

window.addEventListener('load', () => {
  init();
});

// onload / init
const init = () => {
  console.log('페이지 로드 완료');
};





// ==================================================

// flexablePanel
class flexablePanel {
  constructor() {
    // element
    this.wrap = document.querySelector('.workspace');
    this.lnb = document.querySelector('.lnb');
    this.main = document.querySelector('.mainColumn');
    this.aside = document.querySelector('.panelChat');
    this.resizeHandle = document.querySelector('.resizeHandle');

    // state
    this.isResizing = false;

    // option
    this.MAIN_MIN_WIDTH = 1100;
    this.ASIDE_MIN_WIDTH = 512;
    this.ASIDE_MAX_WIDTH = 1048;

    // bind
    this.handleResize = this.handleResize.bind(this);
    this.stopResize = this.stopResize.bind(this);

    // init
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // resize handle
    this.resizeHandle.addEventListener('mousedown', (e) => {
      this.startResize(e);
    });
  }

  startResize() {
    this.isResizing = true;

    document.body.classList.add('isResizing');
    document.addEventListener('mousemove', this.handleResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  handleResize(e) {
    if (!this.isResizing) return;

    const wrapRect = this.wrap.getBoundingClientRect();
    const lnbWidth = this.lnb.offsetWidth;

    // 현재 마우스 위치 기준 aside width 계산
    let newAsideWidth = wrapRect.right - e.clientX - 10;

    // main 최소 width 고려
    const maxAllowedAside = wrapRect.width - lnbWidth - this.MAIN_MIN_WIDTH;

    // 최종 최대값 계산
    const finalMaxAside = Math.min(this.ASIDE_MAX_WIDTH, maxAllowedAside);

    // clamp
    newAsideWidth = Math.max(this.ASIDE_MIN_WIDTH, Math.min(finalMaxAside, newAsideWidth));
    this.aside.style.width = `${newAsideWidth}px`;
  }

  stopResize() {
    this.isResizing = false;

    document.body.classList.remove('isResizing');
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.stopResize);
  }
}

// TabMenu
class TabMenu {
  constructor(element) {
    this.tabMenu = element;
    this.buttons = this.tabMenu.querySelectorAll(':scope > .tabButtons .tabButton');
    this.contents = this.tabMenu.querySelectorAll(':scope > .tabContent');
    this.init();
  }
  init() {
    this.buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        this.activateTab(index);
      });
    });
  }

  activateTab(index) {
    this.buttons.forEach(btn => {
      btn.classList.remove('isActive');
    });
    this.contents.forEach(content => {
      content.classList.remove('isActive');
    });
    this.buttons[index].classList.add('isActive');
    this.contents[index].classList.add('isActive');

    // DropdownAnchorPlugin
    document.dispatchEvent(
      new CustomEvent('layoutChanged',{
        detail:{
          target:this.contents[index]
        }
      })
    );
  }
}

// form / range
class RangeSlider {
  constructor(root, options = {}) {
    this.root = root;

    this.options = {
      min: Number(root.dataset.min ?? 0),
      max: Number(root.dataset.max ?? 100),
      value: Number(root.dataset.value ?? 0),
      disabled: root.dataset.disabled === "true",
      ...options,
    };

    // state
    this.state = {
      value: this.options.value,
      dragging: false,
      disabled: this.options.disabled,
    };

    // elements
    this.el = {
      input: root.querySelector(".slider__input"),
      track: root.querySelector(".slider__track"),
      fill: root.querySelector(".slider__fill"),
      thumb: root.querySelector(".slider__thumb"),
      value: root.querySelector(".slider__value"),
    };

    this.init();
  }

  /* -------------------------
   * init
  ------------------------- */
  init() {
    this.setupInput();
    this.bindEvents();
    this.applyDisabledState();
    this.render();
  }

  setupInput() {
    const { min, max, value } = this.options;

    this.el.input.min = min;
    this.el.input.max = max;
    this.el.input.value = value;
  }

  /* -------------------------
   * events
  ------------------------- */
  bindEvents() {
    this.el.input.addEventListener("input", (e) => {
      if (this.state.disabled) return;
      this.setValue(Number(e.target.value));
    });

    this.el.thumb.addEventListener("pointerdown", (e) => {
      if (this.state.disabled) return;

      this.state.dragging = true;
      this.el.thumb.setPointerCapture(e.pointerId);
    });

    window.addEventListener("pointermove", (e) => {
      if (this.state.disabled) return;
      if (!this.state.dragging) return;

      this.updateFromPointer(e.clientX);
    });

    window.addEventListener("pointerup", () => {
      this.state.dragging = false;
    });

    this.el.track.addEventListener("click", (e) => {
      if (this.state.disabled) return;

      this.updateFromPointer(e.clientX);
    });
  }

  /* -------------------------
   * core logic
  ------------------------- */
  updateFromPointer(clientX) {
    const rect = this.el.track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;

    const clamped = Math.max(0, Math.min(1, ratio));

    const value =
      this.options.min + clamped * (this.options.max - this.options.min);

    this.setValue(value);
  }

  setValue(value) {
    if (this.state.disabled) return;

    const v = Math.round(value);

    this.state.value = v;
    this.el.input.value = v;

    this.render();
  }

  /* -------------------------
   * render
  ------------------------- */
  render() {
    const { min, max } = this.options;
    const percent =
      ((this.state.value - min) / (max - min)) * 100;

    this.el.fill.style.width = `${percent}%`;
    this.el.thumb.style.left = `${percent}%`;
    this.el.value.textContent = this.state.value;
  }

  /* -------------------------
   * disabled
  ------------------------- */
  setDisabled(state) {
    this.state.disabled = Boolean(state);
    this.applyDisabledState();
  }

  applyDisabledState() {
    const { disabled } = this.state;

    this.root.classList.toggle("is-disabled", disabled);
    this.el.input.disabled = disabled;

    if (disabled) {
      this.state.dragging = false;
    }
  }
}





// ==================================================

// AccordionJob
class AccordionJob {
  constructor(selector) {
    this.accordions = document.querySelectorAll(selector);
    this.init();
  }
  init() {
    this.accordions.forEach(button => {
      button.addEventListener(
        'click',
        () => this.toggle(button)
      );
    });
  }

  toggle(button) {
    const detailArea = button.closest('.detailArea');
    const accordion = detailArea.querySelector('.infoJobSkill');
    const isExpand = accordion.classList.contains('isExpand');

    // =========================
    // 접기
    // =========================
    if (isExpand) {
      accordion.classList.remove('isExpand');
      accordion.classList.add('isCollapse');

      button.classList.remove('isExpand');
      button.classList.add('isCollapse');
    }

    // =========================
    // 펼치기
    // =========================
    else {
      accordion.classList.remove('isCollapse');
      accordion.classList.add('isExpand');

      button.classList.remove('isCollapse');
      button.classList.add('isExpand');
    }
  }
}

// Accordion
class Accordion {
  constructor(root, options = {}) {
    this.root = root;
    this.items = [...root.querySelectorAll('.accordion')];

    // get items() {
    //   return [...this.root.querySelectorAll('.accordion')];
    // }

    this.options = {
      expandText: '접기',
      collapseText: '펼치기',
      easing: 'ease',

      ...options
    };

    this.isToggleAll = root.classList.contains('toggleAll');

    this.onClick = this.handleClick.bind(this);
    this.onChange = this.handleChange.bind(this);

    this.init();
  }

  static init(selector = '[data-ui="accordions"]', options) {
    return [...document.querySelectorAll(selector)].map(
      (root) => new Accordion(root, options)
    );
  }

  /* =========================
   * INIT
   * ========================= */

  init() {
    if (!this.items.length) return;

    this.bindEvents();
    this.setupInitialState();
  }

  /* =========================
   * EVENTS
   * ========================= */

  bindEvents() {
    if (this.root.__accordionBound) return;

    this.root.__accordionBound = true;

    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('change', this.onChange);
  }

  handleClick(e) {
    const trigger = e.target.closest('[data-ui="accordionTrigger"]');
    if (!trigger || !this.root.contains(trigger)) return;

    const item = trigger.closest('.accordion');
    if (!item) return;

    if (this.isCheckbox(trigger)) return;

    this.toggle(item);
  }

  handleChange(e) {
    const trigger = e.target.closest('[data-ui="accordionTrigger"]');
    if (!trigger || !this.root.contains(trigger)) return;

    if (!this.isCheckbox(trigger)) return;

    const item = trigger.closest('.accordion');
    if (!item) return;

    this.setExpanded(item, trigger.checked);
  }

  /* =========================
   * INITIAL STATE
   * ========================= */

  setupInitialState() {
    // init 에서 선언 됐지만
    // setupInitialState() 를 직접 호출 하는 API가 생겼을대 대비해서 한번 더 호출
    if (!this.items.length) return;

    const expandedItems = this.items.filter((item) =>
      item.classList.contains('isExpand')
    );

    if (this.isToggleAll && expandedItems.length > 1) {
      expandedItems.forEach((item, idx) => {
        this.setExpanded(item, idx === expandedItems.length - 1, false);
      });
      return;
    }

    this.items.forEach((item) => {
      this.setExpanded(item, item.classList.contains('isExpand'), false);
    });
  }

  /* =========================
   * CORE API
   * ========================= */

  toggle(item) {
    this.setExpanded(item, !item.classList.contains('isExpand'));
  }

  setExpanded(item, expanded, animate = true) {
    if (this.isToggleAll && expanded) {
      this.items.forEach((el) => {
        if (el !== item) this.collapse(el, animate);
      });
    }

    expanded ? this.expand(item, animate) : this.collapse(item, animate);
  }

  /* =========================
   * ⭐ NEW: expandAll / collapseAll
   * ========================= */

  expandAll(animate = true) {
    this.items.forEach((item) => {
      this.expand(item, animate);
    });
  }

  collapseAll(animate = true) {
    this.items.forEach((item) => {
      this.collapse(item, animate);
    });
  }

  /* =========================
   * EXPAND / COLLAPSE
   * ========================= */

  expand(item, animate = true) {
    const body = this.getBody(item);
    if (!body) return;

    item.classList.add('isExpand');
    item.classList.remove('isCollapse');

    this.syncTrigger(item, true);

    if (!animate) {
      body.style.height = 'auto';
      return;
    }

    body.style.transition = `height ${this.options.duration}ms ${this.options.easing}`;
    body.style.height = '0px';

    requestAnimationFrame(() => {
      body.style.height = `${body.scrollHeight}px`;
    });

    body.addEventListener('transitionend', () => {
      body.style.height = 'auto';
      body.style.transition = '';
    }, { once:true });
  }

  collapse(item, animate = true) {
    const body = this.getBody(item);
    if (!body) return;

    item.classList.remove('isExpand');
    item.classList.add('isCollapse');

    this.syncTrigger(item, false);

    if (!animate) {
      body.style.height = '0px';
      return;
    }

    body.style.transition = `height ${this.options.duration}ms ${this.options.easing}`;
    body.style.height = `${body.scrollHeight}px`;

    requestAnimationFrame(() => {
      body.style.height = '0px';
    });
    body.addEventListener('transitionend', () => {
      body.style.transition = '';
    }, { once:true });
  }

  /* =========================
   * TRIGGER
   * ========================= */

  getTrigger(item) {
    return item.querySelector('[data-ui="accordionTrigger"]');
  }
  getLabel(item) {
    return item.querySelector('[data-ui="accordionTriggerLabel"]');
  }
  isCheckbox(trigger) {
    return trigger.tagName === 'INPUT' && trigger.type === 'checkbox';
  }
  syncTrigger(item, expanded) {
    const trigger = this.getTrigger(item);
    const label = this.getLabel(item);

    if (!trigger) return;
    if (this.isCheckbox(trigger)) {
      trigger.checked = expanded;
    }

    // trigger.setAttribute('aria-expanded', expanded);
    trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    if (!label) return;
    if (label) {label.textContent = expanded ? this.options.expandText : this.options.collapseText;}
  }

  /* =========================
   * HELPERS
   * ========================= */

  getBody(item) {
    return item.querySelector('.accordionBody');
  }

  /* =========================
   * DESTROY
   * ========================= */

  destroy() {
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('change', this.onChange);

    delete this.root.dataset.accordionBound;
  }

  refresh() {
    this.items = [...this.root.querySelectorAll('.accordion')];
    this.setupInitialState();
  }
}

const TooltipConst = {
    CLASS: {
        TOOLTIP: 'tooltip',
        CONTENT: 'tooltipContent',
        ACTIVE: 'isActive'
    },
    DEFAULT: {
        CASE: 'case1',
        ALIGN: 'center',
        POSITION: 'top',
        OFFSET: 0,
        VIEWPORT_PADDING: 0,
        HIDE_DELAY: 200
    }
};

// Tooltip / dataset
class Tooltip {
  constructor(options = {}) {
    this.options = {
      containerSelector: '.bodyPanel, .panel',
      offset: TooltipConst.DEFAULT.OFFSET,
      viewportPadding: TooltipConst.DEFAULT.VIEWPORT_PADDING,
      defaultCase: TooltipConst.DEFAULT.CASE,
      defaultAlign: TooltipConst.DEFAULT.ALIGN,
      defaultPosition: TooltipConst.DEFAULT.POSITION,
      hideDelay: TooltipConst.DEFAULT.HIDE_DELAY,
      ...options
    };

    this.button = null;
    this.tooltip = null;
    this.container = null;
    this.hideTimer = null;
    this.resizeObserver = null;

    this.bind();
  }

  bind() {
    document.addEventListener('mouseover', e => {
      const button = this.getTrigger(e.target);
      if (!button) return;
      clearTimeout(this.hideTimer);
      this.show(button);
    });

    document.addEventListener('mouseout', e => {
      const button = this.getTrigger(e.target);
      if (!button) return;
      this.delayHide();
    });

    document.addEventListener('focusin', e => {
      const button = this.getTrigger(e.target);
      if (!button) return;
      this.show(button);
    });

    document.addEventListener('focusout', e => {
      const button = this.getTrigger(e.target);
      if (!button) return;
      this.hide();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.hide();
    });

    window.addEventListener('resize', () => {
      if (this.tooltip) this.update();
    });

    document.addEventListener('scroll', () => {
      if (this.tooltip) this.update();
    }, true);
  }

  show(button) {
    if (!button) return;

    clearTimeout(this.hideTimer);
    if (this.button === button && this.tooltip) {
      this.update();
      return;
    }
    this.hide();
    this.button = button;
    this.container = this.getContainer(button);
    this.create();
    this.update();
    this.observe();
  }

  hide() {
    if (!this.tooltip) return;

    clearTimeout(this.hideTimer);
    this.unobserve();
    this.destroy();

    this.button = null;
    this.container = null;
  }

  delayHide() {
    clearTimeout(this.hideTimer);

    this.hideTimer = setTimeout(() => {
        this.hide();
    }, this.options.hideDelay);
  }

  create() {
    const tooltipCase = this.button.dataset.tooltipCase || this.options.defaultCase;
    const align = this.button.dataset.tooltipAlign || this.options.defaultAlign;
    const position = this.button.dataset.tooltipPosition || this.options.defaultPosition;

    this.tooltip = document.createElement('div');
    this.tooltip.className = `${TooltipConst.CLASS.TOOLTIP} typeText ${tooltipCase} ${align} ${position} ${TooltipConst.CLASS.ACTIVE}`;
    this.tooltip.innerHTML = `<span class="${TooltipConst.CLASS.CONTENT}">${this.getContent()}</span>`;

    this.tooltip.addEventListener('mouseenter', () => {
        clearTimeout(this.hideTimer);
    });

    this.tooltip.addEventListener('mouseleave', () => {
        this.delayHide();
    });

    document.body.appendChild(this.tooltip);
  }

  destroy() {
    if (!this.tooltip) return;

    this.tooltip.remove();
    this.tooltip = null;
  }

  getContent() {
    return (this.button.dataset.tooltip || '').replace(/\s*\|\s*/g, '<br>');
  }

  getContainer(button) {
    return button.closest(this.options.containerSelector) || document.body;
  }

  getAvailableSpace(rects) {
    return {
      left: rects.button.left - rects.container.left,
      right: rects.container.right - rects.button.right,
      top: rects.button.top - rects.container.top,
      bottom: rects.container.bottom - rects.button.bottom
    };
  }

  getTrigger(target) {
    return target instanceof Element ? target.closest('[data-tooltip]') : null;
  }

  observe() {
    if (!this.tooltip || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.update();
    });

    this.resizeObserver.observe(this.tooltip);
  }

  unobserve() {
    if (!this.resizeObserver) return;

    this.resizeObserver.disconnect();
    this.resizeObserver = null;
  }

  update() {
    if (!this.tooltip || !this.button) return;

    const rects = this.measure();
    const placement = this.findBestPlacement(rects);

    // console.log('update placement', placement);

    this.applyPlacement(placement);
  }

  measure() {
    return {
      button: this.button.getBoundingClientRect(),
      tooltip: this.tooltip.getBoundingClientRect(),
      container: this.container.getBoundingClientRect()
    };
  }

  buildCandidates(align, position) {
    const oppositeAlign = {
      left: 'right',
      right: 'left',
      center: 'center'
    }[align];

    const oppositePosition = position === 'top' ? 'bottom' : 'top';

    return [
      { align, position },
      { align, position: oppositePosition },
      { align: oppositeAlign, position },
      { align: oppositeAlign, position: oppositePosition },
      { align: 'center', position },
      { align: 'center', position: oppositePosition }
    ];
  }

  findBestPlacement(rects) {
    const space = this.getAvailableSpace(rects);

    const autoAlign =
      space.left < rects.tooltip.width + this.options.offset ? 'right' :
      space.right < rects.tooltip.width + this.options.offset ? 'left' :
      'center';

    const autoPosition = space.top < rects.tooltip.height + this.options.offset ? 'bottom' : 'top';
    const align = this.button.dataset.tooltipAlign || autoAlign;
    const position = this.button.dataset.tooltipPosition || autoPosition;
    const candidates = this.buildCandidates(align, position);

    let best = null;
    for (const candidate of candidates) {
      const placement = this.calcPlacement(rects, candidate);
      const overflow = this.calcOverflow(placement, rects.container);
      const result = {
          ...placement,
          overflow
      };

      if (!best || overflow.total < best.overflow.total) {
          best = result;
          // 완전히 들어가는 경우라도 바로 종료하지 않는다.
          // 후보 순서(buildCandidates)가 우선순위를 결정하므로
          // 더 좋은 후보가 있는지 끝까지 확인한다.
      }
    }

    return best;
  }

  calcPlacement(rects, candidate) {
    const { button, tooltip } = rects;

    let left = 0;
    let top = 0;

    if (candidate.align === 'left') {
      // left = button.left - tooltip.width - this.options.offset;
      left = button.right - tooltip.width - this.options.offset;
    } else if (candidate.align === 'right') {
      // left = button.right + this.options.offset;
      left = button.left + this.options.offset;
    } else {
      left = button.left + (button.width - tooltip.width) / 2;
    }

    if (candidate.position === 'bottom') {
        top = button.bottom + this.options.offset;
    } else {
        top = button.top - tooltip.height - this.options.offset;
    }

    return {
        align: candidate.align,
        position: candidate.position,
        left: left + window.scrollX,
        top: top + window.scrollY
    };
  }

  calcOverflow(position, container) {
    const padding = this.options.viewportPadding;
    const width = this.tooltip.offsetWidth;
    const height = this.tooltip.offsetHeight;

    const left = Math.max(container.left + padding - position.left, 0);
    const right = Math.max(position.left + width - container.right + padding, 0);
    const top = Math.max(container.top + padding - position.top, 0);
    const bottom = Math.max(position.top + height - container.bottom + padding, 0);

    return {
      left,
      right,
      top,
      bottom,
      total: left + right + top + bottom
    };
  }

  applyPlacement(placement) {
    if (!placement) return;

    this.tooltip.classList.remove('left', 'center', 'right', 'top', 'bottom');

    if (placement.align) this.tooltip.classList.add(placement.align);
    if (placement.position) this.tooltip.classList.add(placement.position);

    this.tooltip.style.left = `${placement.left}px`;
    this.tooltip.style.top = `${placement.top}px`;

    // console.log('apply placement', placement);
  }
}

// Tooltip 삭제 예정
class Tooltip2 {
  constructor() {
    this.targets = document.querySelectorAll('[data-tooltip]');
    this.tooltip = null;
    this.currentTarget = null;
    this.init();
  }

  init() {
    this.targets.forEach(target => {
      target.addEventListener( 'mouseenter', (e) => this.show(e.currentTarget) );
      target.addEventListener( 'mouseleave', () => this.hide() );
    });

    // resize
    window.addEventListener( 'resize', () => {
        if (this.currentTarget) {
          this.show(this.currentTarget);
        }
      }
    );

    // scroll
    window.addEventListener( 'scroll', () => {
        if (this.currentTarget) {
          this.show(this.currentTarget);
        }
      }
    );
  }

  createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip typeText';
    tooltip.innerHTML = `<span class="tooltipContent"></span>`;
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }

  show(target) {
    this.currentTarget = target;
    const text = target.dataset.tooltip;

    if (!this.tooltip) { this.createTooltip(); }

    const tooltipContent = this.tooltip.querySelector('.tooltipContent');
    tooltipContent.innerHTML = text.replace(/\|/g, '<br>');

    // =========================
    // 위치 초기화 (핵심)
    // =========================
    this.tooltip.style.top = `0px`;
    this.tooltip.style.left = `0px`;

    this.tooltip.classList.add('isActive');

    // =========================
    // 강제 reflow
    // =========================
    this.tooltip.offsetHeight;

    // =========================
    // 최신 사이즈 재계산
    // =========================
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let top = targetRect.top - tooltipRect.height - 6;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    // 좌우 보정
    const padding = -8;

    if (left < padding) {
      left = padding;
    }

    if (left + tooltipRect.width > window.innerWidth - padding) {
      left =   window.innerWidth - tooltipRect.width - padding;
    }

    // 위 공간 부족 시 아래 표시
    if (top < padding) {
      top = targetRect.bottom + 12;
      this.tooltip.classList.add('arrowUp');
    }

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  hide() {
    if (!this.tooltip) return;
    this.tooltip.classList.remove('isActive', 'arrowUp');
    this.currentTarget = null;
  }
}

// Tooltip / TooltipArray
class TooltipArray {
  constructor() {
    this.tooltip = null;
    this.target = null;

    this.bindEvents();
  }

  createTooltip(className = 'tooltip') {
    const tooltip = document.createElement('div');
    tooltip.className = className;

    return tooltip;
  }

  updatePosition() {
    if (!this.tooltip || !this.target) return;

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const targetRect = this.target.getBoundingClientRect();
    const gap = 8;

    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    let top = targetRect.bottom + gap;

    // viewport 기준
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + tooltipRect.width > viewportWidth - gap) {
      left = viewportWidth - tooltipRect.width - gap;
    }

    if (left < gap) {
      left = gap;
    }

    // 아래 공간 부족하면 위로
    if (top + tooltipRect.height > viewportHeight - gap) {
      top = targetRect.top - tooltipRect.height - gap;
    }

    if (top < gap) {
      top = gap;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  render(arr) {
    const listHtml = arr
      .map(({ name, status, value }) => {
        const statusClass = status === 'down' ? 'isDown' : 'isUp';

        return `
          <div class="row">
            <dt>${name}</dt>
            <dd>
              <span class="rateIndex ${statusClass}">${value}</span>
            </dd>
          </div>
        `;
      })
      .join('');

    this.tooltip.innerHTML = `
      <button type="button" class="button iconOnly buttonClose size8">툴팁 닫기</button>
      <dl>
        ${listHtml}
      </dl>
    `;
  }

  show(target, arr) {
    // 기존 툴팁 제거
    this.hide();
    this.target = target;
    this.target.classList.add('isTooltipActive');

    const tooltipClass = target.dataset.tooltipClass || 'tooltip';

    // 생성 후 body에 추가
    this.tooltip = this.createTooltip(tooltipClass);
    document.body.appendChild(this.tooltip);

    this.render(arr);
    this.tooltip.classList.add('isActive');

    this.updatePosition();

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const gap = 8;

    let left = window.scrollX + targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;

    let top = window.scrollY + targetRect.bottom + gap;

    const viewportLeft = window.scrollX;
    const viewportRight = window.scrollX + window.innerWidth;
    const viewportTop = window.scrollY;
    const viewportBottom = window.scrollY + window.innerHeight;

    if (left + tooltipRect.width > viewportRight - gap) {
      left = viewportRight - tooltipRect.width - gap;
    }

    if (left < viewportLeft + gap) {
      left = viewportLeft + gap;
    }

    if (top + tooltipRect.height > viewportBottom - gap) {
      top = window.scrollY + targetRect.top - tooltipRect.height - gap;
    }

    if (top < viewportTop + gap) {
      top = viewportTop + gap;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hide() {
    if (this.target) {
      this.target.classList.remove('isTooltipActive');
      this.target = null;
    }
    
    if (!this.tooltip) return;

    this.tooltip.remove();
    this.tooltip = null;
  }

  bindEvents() {
    document.addEventListener('click', e => {
      const cell = e.target.closest('[data-tooltip-arr]');
      // 닫기 버튼
      if (e.target.closest('.buttonClose')) {
        this.hide();
        return;
      }

      // 툴팁 열기
      if (cell) {
        // 같은 버튼 클릭 → 닫기
          if (this.target === cell) {
            this.hide();
            return;
          }
        const arr = JSON.parse(cell.dataset.tooltipArr || '[]');
        this.show(cell, arr);
        return;
      }

      // 툴팁 내부 클릭
      if (this.tooltip && this.tooltip.contains(e.target)) {
        return;
      }

      // 바깥 클릭
      this.hide();
    });

    window.addEventListener('scroll', () => {
      this.updatePosition();
    }, true);   // true를 권장

    window.addEventListener('resize', () => {
      this.updatePosition();
    });

    // mouse event : over/out
    /*
    document.addEventListener('mouseover', e => {
      const cell = e.target.closest('[data-members]');
      if (!cell) return;
      const members = JSON.parse(cell.dataset.members || '[]');
      this.show(cell, members);
    });

    document.addEventListener('mouseout', e => {
      const cell = e.target.closest('[data-members]');
      if (!cell) return;
      this.hide();
    });
    */
  }
}

// Tooltip / clone
class TooltipClone {
  constructor() {
      this.tooltip = null;
      this.currentButton = null;
      this.currentScrollContainer = null;
      this.removeTimer = null;

      this.gap = 8;

      // 실제 레이아웃 스크롤 영역
      this.scrollContainerSelectors = [
          '.bodyPanel',
          '.panelBody',
      ];

      this.handleScroll = () => {
          if (!this.tooltip) return;

          requestAnimationFrame(() => {
              this.positionTooltip();
          });
      };

      this.bindEvents();

      window.addEventListener('resize', () => {
          this.positionTooltip();
      });
  }

  bindEvents() {
      document.addEventListener('mouseover', (e) => {
          const button = e.target.closest(
              '[data-tooltip-clone-button]'
          );

          if (!button) return;

          if (this.currentButton === button) {
              this.cancelRemove();
              return;
          }

          this.createTooltip(button);
      });

      document.addEventListener('mouseout', (e) => {
          const button = e.target.closest(
              '[data-tooltip-clone-button]'
          );

          if (!button) return;

          this.scheduleRemove();
      });
  }

  createTooltip(button) {
    this.removeTooltip();

    const key = button.dataset.tooltipCloneButton;
    const content = document.querySelector(
        `[data-tooltip-clone-content="${key}"]`
    );

    if (!content) return;

    const tooltip = document.createElement('div');

    tooltip.className = 'tooltip typeClone isActive';
    tooltip.innerHTML = content.innerHTML;

    document.body.appendChild(tooltip);

    tooltip.addEventListener('mouseenter', () => {
        this.cancelRemove();
    });

    tooltip.addEventListener('mouseleave', () => {
        this.scheduleRemove();
    });

    this.tooltip = tooltip;
    this.currentButton = button;
    this.bindScrollContainer(button);
    this.positionTooltip();
  }

  bindScrollContainer(button) {
      const selectors = this.scrollContainerSelectors.join(',');
      const container = button.closest(selectors);

      if (!container) return;

      this.currentScrollContainer = container;

      container.addEventListener(
          'scroll',
          this.handleScroll,
          { passive: true }
      );
  }

  unbindScrollContainer() {
      if (!this.currentScrollContainer) return;

      this.currentScrollContainer.removeEventListener(
          'scroll',
          this.handleScroll
      );

      this.currentScrollContainer = null;
  }

  positionTooltip() {
      if (!this.tooltip || !this.currentButton) return;

      const tooltip = this.tooltip;
      const button = this.currentButton;
      const buttonRect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let top;
      let left;

      tooltip.classList.remove(
          'is-top',
          'is-bottom',
          'arrow-left',
          'arrow-right'
      );

      // -------------------------
      // 세로 위치
      // -------------------------

      const spaceBelow = window.innerHeight - buttonRect.bottom;

      if ( spaceBelow >= tooltipRect.height + this.gap
      ) {
          top = buttonRect.bottom + this.gap;
          tooltip.classList.add('is-bottom');
      } else {
          top = buttonRect.top - tooltipRect.height - this.gap;
          tooltip.classList.add('is-top');
      }

      // -------------------------
      // 가로 위치
      // -------------------------

      const spaceRight = window.innerWidth - buttonRect.right;

      if (
          spaceRight >= tooltipRect.width - buttonRect.width
      ) {
          left = buttonRect.left;
          tooltip.classList.add(
              'arrow-left'
          );
      } else {
          left = buttonRect.right - tooltipRect.width;
          tooltip.classList.add(
              'arrow-right'
          );
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
  }

  scheduleRemove() {
      this.cancelRemove();

      this.removeTimer = setTimeout(() => {
          this.removeTooltip();
      }, 100);
  }

  cancelRemove() {
      clearTimeout(this.removeTimer);
  }

  removeTooltip() {
      this.cancelRemove();
      this.unbindScrollContainer();

      if (this.tooltip) {
          this.tooltip.remove();
      }

      this.tooltip = null;
      this.currentButton = null;
  }
}

// Tooltip / TooltipMember
class TooltipMember {
  constructor() {
    this.tooltip = null;
    this.target = null;

    this.bindEvents();
  }

  createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip typeMember';
    return tooltip;
  }

  updatePosition() {
    if (!this.tooltip || !this.target) return;

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const targetRect = this.target.getBoundingClientRect();
    const gap = 8;

    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    let top = targetRect.bottom + gap;

    // viewport 기준
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + tooltipRect.width > viewportWidth - gap) {
      left = viewportWidth - tooltipRect.width - gap;
    }

    if (left < gap) {
      left = gap;
    }

    // 아래 공간 부족하면 위로
    if (top + tooltipRect.height > viewportHeight - gap) {
      top = targetRect.top - tooltipRect.height - gap;
    }

    if (top < gap) {
      top = gap;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  render(members) {
    const listHtml = members
      .map(
        ({ name, status }) => `
          <li>
            <span class="assign ${status}">
              ${name}
            </span>
          </li>
        `
      )
      .join('');

    this.tooltip.innerHTML = `
      <button type="button" class="button iconOnly buttonClose size8">툴팁 닫기</button>
      <ul class="memberSimpleList">
        ${listHtml}
      </ul>
    `;
  }

  show(target, members) {
    // 기존 툴팁 제거
    this.hide();
    this.target = target;

    // 생성 후 body에 추가
    this.tooltip = this.createTooltip();
    document.body.appendChild(this.tooltip);

    this.render(members);
    this.tooltip.classList.add('isActive');

    this.updatePosition();

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const gap = 8;

    let left = window.scrollX + targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;

    let top = window.scrollY + targetRect.bottom + gap;

    const viewportLeft = window.scrollX;
    const viewportRight = window.scrollX + window.innerWidth;
    const viewportTop = window.scrollY;
    const viewportBottom = window.scrollY + window.innerHeight;

    if (left + tooltipRect.width > viewportRight - gap) {
      left = viewportRight - tooltipRect.width - gap;
    }

    if (left < viewportLeft + gap) {
      left = viewportLeft + gap;
    }

    if (top + tooltipRect.height > viewportBottom - gap) {
      top = window.scrollY + targetRect.top - tooltipRect.height - gap;
    }

    if (top < viewportTop + gap) {
      top = viewportTop + gap;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hide() {
    if (!this.tooltip) return;

    this.tooltip.remove();
    this.tooltip = null;
  }

  bindEvents() {
    document.addEventListener('click', e => {
      const cell = e.target.closest('[data-members]');

      // 닫기 버튼
      if (e.target.closest('.buttonClose')) {
        this.hide();
        return;
      }

      // 툴팁 열기
      if (cell) {
        const members = JSON.parse(cell.dataset.members || '[]');
        this.show(cell, members);
        return;
      }

      // 툴팁 내부 클릭
      if (this.tooltip && this.tooltip.contains(e.target)) {
        return;
      }

      // 바깥 클릭
      this.hide();
    });

    window.addEventListener('scroll', () => {
      this.updatePosition();
    }, true);   // true를 권장

    window.addEventListener('resize', () => {
      this.updatePosition();
    });

    // mouse event : over/out
    /*
    document.addEventListener('mouseover', e => {
      const cell = e.target.closest('[data-members]');
      if (!cell) return;
      const members = JSON.parse(cell.dataset.members || '[]');
      this.show(cell, members);
    });

    document.addEventListener('mouseout', e => {
      const cell = e.target.closest('[data-members]');
      if (!cell) return;
      this.hide();
    });
    */
  }
}

// TableScroller
class TableScroller {
  constructor(options = {}) {
    this.className = options.className || 'tablesScrollX';
    this.sliders = document.querySelectorAll(`.${this.className}`);

    if (!this.sliders.length) {
      console.warn(`.${this.className} elements not found.`);
      return;
    }

    this.init();
  }

  init() {
    this.sliders.forEach((slider) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      slider.addEventListener('mouseup', () => {
        isDown = false;
      });

      slider.addEventListener('mouseleave', () => {
        isDown = false;
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;

        slider.scrollLeft = scrollLeft - walk;
      });
    });
  }

}

// switch toggle
const initCheckToggleItems = () => {
  const getDefaultDisplay = (el) => {
    return el.dataset.display || 'table-cell';
  };

  const applyToggle = (checkbox) => {
    const targetName = checkbox.dataset.checkToggleItemButton;
    const isChecked = checkbox.checked;

    const cells = document.querySelectorAll( `[data-check-toggle-item-target="${targetName}"]` );
    const cols = document.querySelectorAll( `col[data-check-toggle-item-target="${targetName}"]` );

    cells.forEach((el) => {
      const toggleColspan = el.dataset.toggleColspan;

      // =========================
      // CASE 1: colspan 제어 (0 제외)
      // =========================
      if (toggleColspan !== undefined && toggleColspan !== '0') {
        if (!el.dataset.originalColspan) {
          el.dataset.originalColspan = el.getAttribute('colspan') || '1';
        }

        el.setAttribute( 'colspan', isChecked ? toggleColspan : el.dataset.originalColspan );

        return;
      }

      // =========================
      // CASE 2: display toggle 전용 (toggle-colspan=0)
      // =========================
      if (toggleColspan === '0') {
        el.style.display = isChecked ? getDefaultDisplay(el) : 'none';

        return;
      }

      // =========================
      // CASE 3: 일반 cell
      // =========================
      el.style.display = isChecked ? getDefaultDisplay(el)  : 'none';
    });

    // =========================
    // colgroup 동기화 (핵심)
    // =========================
    cols.forEach((col) => {
      col.style.display = isChecked ? '' : 'none';
    });
  };

  document.querySelectorAll('[data-check-toggle-item-button]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      applyToggle(checkbox);
    });

    applyToggle(checkbox); // 초기 상태 반영
  });
};

// form / Dropdown
class Dropdown {
  constructor(element) {
    this.dropdown = element;
    this.button = this.dropdown.querySelector('.dropdownButton');
    this.menu = this.dropdown.querySelector('.dropdownMenu');
    this.isOpen = false;
    this.events = {};
    this.init();
  }

  /*
  ====================================
  Init
  ====================================
  */
  init() {
    if(!this.dropdown.classList.contains('borderNone')){
      this.syncButtonWidth();
    }
    this.syncSelected();
    this.observeMenu();
    this.bindEvents();
  }

  /*
  ====================================
  Initial Selected
  ====================================
  */
  syncSelected(){
    this.button.dataset.placeholder = this.button.textContent.trim();
    const selected = this.dropdown.querySelector('.menuButton.isSelected');

    if(selected){
      this.setButtonText(selected.textContent.trim());
    }else{
      this.button.classList.add('placeholder');
    }
  }

  /*
  ====================================
  Width Sync
  ====================================
  */
  syncButtonWidth() {
    const menuInner = this.dropdown.querySelector('.dropdownMenuInner > .menuItem:first-child');
    if(menuInner){
      this.button.style.minWidth = `${menuInner.scrollWidth}px`;
    }
  }

  /*
  ====================================
  Event Binding
  ====================================
  */
  bindEvents() {
    /*
    Button Toggle
    */
    this.button.addEventListener('click', e => {
      e.stopPropagation();
      Dropdown.closeAll(this);
      this.toggle();
    });

    /*
    Menu Select
    */
    this.dropdown.addEventListener('click', e => {
      const menuButton = e.target.closest('.menuButton');
      if(!menuButton) return;

      if(menuButton === this.button) return;

      this.select(menuButton);
    });
  }

  /*
  ====================================
  Select
  ====================================
  */
  // select(
  //   menuButton,
  //   options = {}
  // ){
  //   const {silent = false} = options;
  //   const selectedText = menuButton.textContent.trim();

  //   /*
  //   Button Text 변경
  //   */
  //   this.button.classList.remove('placeholder');
  //   this.setButtonText(selectedText);

  //   /*
  //   Button Text 변경
  //   */
  //   this.setButtonText(selectedText);

  //   /*
  //   Selected Reset
  //   */
  //   this.dropdown.querySelectorAll('.menuButton').forEach(item => {item.classList.remove('isSelected');});

  //   /*
  //   Current Selected
  //   */
  //   menuButton.classList.add('isSelected');

  //   /*
  //   Event Emit
  //   */
  //   if(!silent){
  //     this.emit('change', {
  //       dropdown: this.dropdown,
  //       button: menuButton,
  //       value: menuButton.dataset.anchorTarget ?? menuButton.dataset.value ?? null,
  //       text: selectedText
  //     });
  //   }
  //   this.close();
  // }

  select(
    menuButton,
    options = {}
  ){
    const {
      silent = false,
      unselect = false
    } = options;

    /*
    선택 해제
    */
    if(unselect){
      this.dropdown.querySelectorAll('.menuButton').forEach(item => {
        item.classList.remove('isSelected');
      });

      this.button.classList.add('placeholder');

      const placeholder = this.button.dataset.placeholder;
      if(placeholder){
        this.setButtonText(placeholder);
      }

      if(!silent){
        this.emit('change', {
          dropdown: this.dropdown,
          button: null,
          value: null,
          text: null
        });
      }
      this.close();

      return;
    }

    const selectedText = menuButton.textContent.trim();

    this.button.classList.remove('placeholder');
    this.setButtonText(selectedText);
    this.dropdown.querySelectorAll('.menuButton').forEach(item => {
      item.classList.remove('isSelected');
    });

    menuButton.classList.add('isSelected');

    if(!silent){
      this.emit('change', {
        dropdown: this.dropdown,
        button: menuButton,
        value: menuButton.dataset.anchorTarget ?? menuButton.dataset.value ?? null,
        text: selectedText
      });
    }

    this.close();
  }

  /*
  ====================================
  Button Text
  ====================================
  */
  setButtonText(text){
    /*
    신규 구조 지원
    <span class="dropdownLabel">
    */
    const label = this.button.querySelector('.dropdownLabel');
    if(label){
      label.textContent = text;

      return;
    }

    /*
    기존 구조 지원
    <button>텍스트</button>
    */
    const textNode =
      [...this.button.childNodes]
        .find(
          node => node.nodeType === Node.TEXT_NODE
        );

    if(textNode){
      textNode.nodeValue = text;
    }
  }

  /*
  ====================================
  Mutation Observer
  ====================================
  */
  observeMenu(){
    const menu = this.dropdown.querySelector('.dropdownMenuInner');

    if(!menu) return;

    this.observer = new MutationObserver(() => {
      if(!this.dropdown.classList.contains('borderNone')){
        this.syncButtonWidth();
      }

      if(!menu.querySelector('.menuButton.isSelected')){
        this.button.classList.add('placeholder');

        if(this.button.dataset.placeholder){
          this.setButtonText(this.button.dataset.placeholder);
        }
      }
    });

    this.observer.observe(menu,{
      childList:true,
      subtree:true
    });

    // 선택은 취소하지만 placeholder 값은 선택도니 값으로 유지하고 싶은 경우
    // this.syncSelected();
  }

  /*
  ====================================
  Open / Close
  ====================================
  */
  toggle(){
    this.isOpen ? this.close() : this.open();
  }

  open(){
    this.isOpen = true;
    this.dropdown.classList.add('isOpen');
  }

  close(){
    this.isOpen = false;
    this.dropdown.classList.remove('isOpen');
  }

  /*
  ====================================
  Event System
  ====================================
  */
  on(
    eventName,
    callback
  ){
    if(!this.events[eventName]){
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  off(
    eventName,
    callback
  ){
    if(!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(fn => fn !== callback);
  }

  emit(
    eventName,
    payload = {}
  ){
    if(!this.events[eventName]) return;
    this.events[eventName].forEach(callback => {callback(payload);});
  }

  destroy(){
    this.observer?.disconnect();
  }

  /*
  ====================================
  Static
  ====================================
  */
  static closeAll(currentInstance = null){
    Dropdown.instances.forEach(instance => {
      if(instance !== currentInstance){
        instance.close();
      }
    });
  }

  static initAll(selector = '.dropdown'){
    const elements = document.querySelectorAll(selector);
    Dropdown.instances = [];
    
    elements.forEach(element => {
      const instance = new Dropdown(element);
      Dropdown.instances.push(instance);
    });

    /*
    Resize
    */
    window.addEventListener('resize', () => {
      Dropdown.instances.forEach(instance => {
        instance.syncButtonWidth();
      });
    });

    /*
    Outside Click
    */
    document.addEventListener('click', e => {
      Dropdown.instances.forEach(instance => {
        if(!instance.dropdown.contains(e.target)){
          instance.close();
        }
      });
    });

    /*
    ESC
    */
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape'){
        Dropdown.closeAll();
      }
    });
  }

  static getInstance(element){
    if(!Dropdown.instances) return null;

    return Dropdown.instances.find(instance => instance.dropdown === element) ?? null;
  }
}

// Dropdown / DropdownAnchorPlugin
class DropdownAnchorPlugin {
  constructor(options = {}) {
    this.selector = options.selector ?? '[data-anchor-dropdown]';
    this.anchorSelector = options.anchorSelector ?? '[data-anchor]';
    this.menuSelector = options.menuSelector ?? '.menuButton';
    this.offset = options.offset ?? 0;
    this.activeOffset = options.activeOffset ?? this.offset;
    this.duration = options.duration ?? 400;
    this.instances = [];
    this.scrollTicking = false;
    this.events = {};
    this.init();
  }

  /*
  ====================================
  Init
  ====================================
  */
  // init(){
  //   const elements =document.querySelectorAll(this.selector);
  //   elements.forEach(element => {
  //     const instance = this.createInstance(element);
  //     if(instance){
  //       this.instances.push(instance);
  //     }
  //   });

  //   this.bindScroll();
  //   this.bindResize();

  //   this.instances.forEach(instance=>{
  //     this.updateSticky(instance);
  //     this.updateActive(instance);
  //   });
  // }

  init(){
    const elements=document.querySelectorAll(this.selector);
    elements.forEach(element=>{
      const instance=this.createInstance(element);
      if(instance){
        this.instances.push(instance);
      }
    });

    this.bindScroll();
    this.bindResize();

    document.addEventListener('layoutChanged',(event)=>{
      const target=event.detail?.target;
      if(target){
        const instance=this.instances.find(instance=>{
          return target.contains(instance.element);
        });

        if(instance){
          this.syncLayout(instance);
        }

        return;
      }

      this.refresh();
    });

    this.instances.forEach(instance=>{
      this.syncLayout(instance);
    });
  }

  /*
  ====================================
  Instance
  ====================================
  */
  createInstance(element){
    const dropdown = Dropdown.getInstance(element);
    if(!dropdown) return null;

    const sections = this.createSections(element);
    const instance = {
      element,
      dropdown,
      sections,
      scrollContainer: element.closest('[data-anchor-scroll]'),
      sticky: false,
      placeholder: null,
      originalTop: element.offsetTop
    };

    instance.originalTop = instance.element.offsetTop;

    /*
    Dropdown 선택 이벤트
    */
    dropdown.on('change', payload => {this.handleChange(payload);});

    return instance;
  }

  /*
  ====================================
  Section Mapping
  ====================================
  */
  // createSections(element){
  //   const buttons = element.querySelectorAll(this.menuSelector);

  //   return [...buttons].map(button => {
  //     const target = button.dataset.anchorTarget;
  //     if(!target) return null;

  //     const section = document.querySelector(`[data-anchor="${target}"]`);
  //     if(!section) return null;

  //     return {
  //       button,
  //       section,
  //       id:target,
  //       top:section.offsetTop
  //     };
  //   })
  //   .filter(Boolean);
  // }
  createSections(element){
    const buttons = element.querySelectorAll(this.menuSelector);

    const scope=
      element.closest('[data-anchor-scope]') ||
      element.closest('.tabContent') ||
      document;

    return [...buttons].map(button=>{
      const target=button.dataset.anchorTarget;
      if(!target) return null;

      const section=scope.querySelector(`[data-anchor="${target}"]`);
      if(!section) return null;

      return {
        button,
        section,
        id:target,
        top:section.offsetTop
      };
    }).filter(Boolean);
  }

  /*
  ====================================
  Dropdown Change
  ====================================
  */
  handleChange(payload){
    if(!payload.value) return;

    const instance = this.instances.find(instance => {
      return instance.sections.some(section=>section.id === payload.value);
    });

    if(!instance) return;

    this.scrollTo(payload.value, instance);
  }

  /*
  ====================================
  Smooth Scroll
  ====================================
  */
  scrollTo(id, instance){
    const target = document.querySelector(`[data-anchor="${id}"]`);
    if(!target) return;

    // const instance=this.instances.find(item=>item.sections.some(section=>section.id === id));
    if(!instance) return;

    const container = instance.scrollContainer;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const start = container.scrollTop;
    // const end = target.offsetTop - this.offset;
    // const end = container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top - this.offset;
    // const end = target.getBoundingClientRect().top - this.offset;
    // const end = container.scrollTop + targetRect.top - containerRect.top - this.offset;
    // const end = target.offsetTop - this.offset;
    const end = target.offsetTop - container.offsetTop - this.activeOffset;
    const distance = end - start;

    let startTime = null;

    const animate=currentTime=>{
      if(!startTime) startTime=currentTime;

      const progress=Math.min((currentTime-startTime) / this.duration,1);

      container.scrollTop=start+distance*this.ease(progress);

      if(progress < 1){
        requestAnimationFrame(animate);
      } else {
        const instance=this.instances.find(item=>item.scrollContainer === container);
        if(instance){
          this.updateActive(instance);
        }
      }
    };

    requestAnimationFrame(animate);

    // console.log({
    //   offsetTop:target.offsetTop,
    //   rectTop:target.getBoundingClientRect().top,
    //   scrollTop:container.scrollTop,
    //   containerTop:container.getBoundingClientRect().top
    // });

    // console.log({
    //   id,
    //   scrollTop:container.scrollTop,
    //   targetTop:target.getBoundingClientRect().top,
    //   containerTop:container.getBoundingClientRect().top,
    //   offset:this.offset
    // });
  }

  ease(t){
    return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /*
  ====================================
  Scroll
  ====================================
  */
  bindScroll(){
    const containers=[...new Set(this.instances.map(item=>item.scrollContainer).filter(Boolean))];

    containers.forEach(container=>{
      container.addEventListener('scroll',()=>{
        if(this.scrollTicking) return;

        this.scrollTicking=true;
        requestAnimationFrame(()=>{
          this.instances
            .filter(item=>item.scrollContainer===container)
            .forEach(instance=>{
              this.updateSticky(instance);
              this.updateActive(instance);
            });

          this.scrollTicking=false;
        });
      });
    });
  }

  /*
  ====================================
  Sticky
  ====================================
  */
  updateSticky(instance){
    const element = instance.element;
    const current = instance.scrollContainer.scrollTop;
    if(current > instance.originalTop){
      if(!instance.sticky){
        const placeholder = document.createElement('div');
        // placeholder.style.height = `${element.offsetHeight}px`;
        // element.parentNode.insertBefore(
        //   placeholder,
        //   element
        // );
        element.parentNode.appendChild(
          placeholder,
          element
        );
        instance.placeholder = placeholder;
        // element.classList.add('isSticky');
        element.closest('[data-anchor-fixed]').classList.add('isSticky');
        instance.sticky = true;
      }
    } else {
      if(instance.sticky){
        instance.placeholder?.remove();
        // element.classList.remove('isSticky');
        element.closest('[data-anchor-fixed]').classList.remove('isSticky');
        instance.placeholder = null;
        instance.sticky = false;
      }
    }
  }

  /*
  ====================================
  Scroll Spy
  ====================================
  */
  updateActive(instance){
    const position = instance.scrollContainer.scrollTop + this.offset + this.activeOffset;
    let current = null;

    instance.sections.forEach(item=>{
      // if(item.section.offsetTop <= position){
      //   current = item;
      // }
      if(item.top <= position){
        current = item;
      }
    });

    if(!current) return;

    const selected = instance.dropdown.dropdown.querySelector('.isSelected');
    if(selected === current.button) return;

    // Scroll Spy에서는 change 이벤트 발생 X
    instance.dropdown.select(current.button,{
      silent : true
    });

    this.emit('active',{
      ...current
    });
  }

  /*
  ====================================
  Resize
  ====================================
  */
  // bindResize(){
  //   window.addEventListener('resize', () => {
  //     this.instances.forEach(instance => {
  //       instance.originalTop = instance.element.offsetTop + instance.scrollContainer.scrollTop;
  //       instance.sections.forEach(item=>{
  //         item.top = item.section.offsetTop;
  //       });
  //     });
  //   });
  // }

  bindResize(){
    window.addEventListener('resize',()=>{
      this.refresh();
    });
  }

  refresh(){
    this.instances.forEach(instance=>{
      this.syncLayout(instance);
    });

    return this;
  }

  syncLayout(instance){
    if(instance.element.offsetParent === null){
      return;
    }

    instance.sections=this.createSections(instance.element);
    instance.originalTop=instance.element.offsetTop;

    instance.sections.forEach(item=>{
      item.top=item.section.offsetTop;
    });

    this.updateSticky(instance);
    this.updateActive(instance);
  }

  /*
  ====================================
  Event
  ====================================
  */
  on(
    event,
    callback
  ){
    if(!this.events[event]){
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(
    event,
    payload={}
  ){
    if(!this.events[event]) return;

    this.events[event].forEach(callback => {
      callback(payload);
    });
  }

  /*
  ====================================
  Destroy
  ====================================
  */
  destroy(){
    this.instances.forEach(instance => {
      // instance.element.classList.remove('isSticky');
      instance.element.closest('[data-anchor-fixed]').classList.remove('isSticky');
      instance.placeholder?.remove();
    });
    this.instances = [];
  }
}

// DragScroll
class DragScroll {
  static selector = '[data-drag-scroll]';
  static instances = new WeakMap();
  static active = null;
  static initialized = false;

  static init(selector = DragScroll.selector) {
    if (!DragScroll.initialized) {
      window.addEventListener('pointermove', DragScroll.handlePointerMove);
      window.addEventListener('pointerup', DragScroll.handlePointerUp);
      window.addEventListener('pointercancel', DragScroll.handlePointerUp);
      DragScroll.initialized = true;
    }

    document.querySelectorAll(selector).forEach(el => {
      if (!DragScroll.instances.has(el)) {
        DragScroll.instances.set(el, new DragScroll(el));
      }
    });
  }

  static handlePointerMove = e => {
    DragScroll.active?.onPointerMove(e);
  };

  static handlePointerUp = e => {
    DragScroll.active?.onPointerUp(e);
  };

  constructor(el) {
    this.el = el;

    this.pointerId = null;
    this.isPointerDown = false;
    this.isDragging = false;

    this.dragThreshold = 6;

    this.startX = 0;
    this.startY = 0;
    this.scrollLeft = 0;
    this.scrollTop = 0;

    this.onPointerDownHandler = this.onPointerDown.bind(this);
    this.el.addEventListener('pointerdown', this.onPointerDownHandler);
  }

  destroy() {
    this.el.removeEventListener('pointerdown', this.onPointerDownHandler);
    DragScroll.instances.delete(this.el);

    if (DragScroll.active === this) {
        DragScroll.active = null;
    }
  }

  onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    DragScroll.active = this;

    this.pointerId = e.pointerId;
    this.isPointerDown = true;
    this.isDragging = false;

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.scrollLeft = this.el.scrollLeft;
    this.scrollTop = this.el.scrollTop;

    this.el.style.userSelect = 'none';
  }

  onPointerMove(e) {
    if (!this.isPointerDown) return;
    if (e.pointerId !== this.pointerId) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (!this.isDragging) {
      if (Math.abs(dx) < this.dragThreshold && Math.abs(dy) < this.dragThreshold) return;

      this.isDragging = true;
      this.el.classList.add('is-dragging');
      this.el.setPointerCapture(this.pointerId);
    }

    this.el.scrollLeft = this.scrollLeft - dx;
    this.el.scrollTop = this.scrollTop - dy;
  }

  onPointerUp(e) {
    if (e.pointerId !== this.pointerId) return;

    this.isPointerDown = false;

    if (this.isDragging) {
      this.isDragging = false;
      this.el.classList.remove('is-dragging');

      if (this.el.hasPointerCapture(this.pointerId)) {
        this.el.releasePointerCapture(this.pointerId);
      }
    }

    this.el.style.userSelect = '';
    this.pointerId = null;

    if (DragScroll.active === this) {
      DragScroll.active = null;
    }
  }
}

// DragDrop
class DragDrop {
  constructor(options = {}) {
    /*
    ==========================
    Options
    ==========================
    */
    this.dragSelector = options.dragSelector ?? '[data-dragTarget]';
    this.dropSelector = options.dropSelector ?? '[data-dropTarget]';
    this.containerSelector = options.containerSelector ?? '[data-dropContainer]';
    this.handleSelector =  options.handleSelector ?? '[data-dragButton]';
    this.deleteSelector = options.deleteSelector ?? '[data-dragDeleteButton]';

    /*
    ==========================
    State
    ==========================
    */
    this.dragItem = null;
    this.placeholder = null;
    this.events = {};
    this.init();
  }

  /*
  ==========================
  Init
  ==========================
  */
  init() {
    this.createPlaceholder();
    this.bindHandle();
    this.bindDrag();
    this.bindDrop();
    this.bindDelete();
  }

  /*
  ==========================
  Event System
  ==========================
  */


  on(eventName, callback) {
    if (!this.events[eventName]) {
        this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(fn => fn !== callback);
  }

  emit(eventName, payload = {}) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => {
      callback(payload);
    });
  }

  /*
  ==========================
  Placeholder
  ==========================
  */
  createPlaceholder() {
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'drag-placeholder';
  }

  /*
  ==========================
  Drag Handle
  ==========================
  */
  bindHandle() {
    document.addEventListener(
      'mousedown',
      e => {
        const handle =  e.target.closest( this.handleSelector );
          if (!handle) return;

          const item = handle.closest( this.dragSelector );
          if (!item) return;

          item.draggable = true;
        }
    );

    document.addEventListener(
      'mouseup',
      () => {
        document.querySelectorAll(this.dragSelector).forEach(item => {
          item.draggable = false;
        });
      }
    );
  }

  /*
  ==========================
  Drag Start / End
  ==========================
  */
  bindDrag() {
    document.addEventListener(
      'dragstart',
      e => {
        const item = e.target.closest( this.dragSelector );
        if (!item) return;

        this.dragItem = item;
        setTimeout(() => {
            item.classList.add('dragging');
        });

        this.emit(
            'dragStart',
            {
                dragItem:item
            }
        );
      }
    );

    document.addEventListener(
      'dragend',
      () => {
        if (!this.dragItem) return;

        this.dragItem.classList.remove('dragging');
        if(this.placeholder.parentElement){
          this.placeholder.remove();
        }

        this.emit(
          'dragEnd',
          {
            dragItem:this.dragItem
          }
        );

        this.dragItem = null;
      }
    );
  }

  /*
  ==========================
  Drop
  ==========================
  */
  bindDrop() {
    document.addEventListener(
      'dragover',
      e => {
        const dropTarget = e.target.closest(this.dropSelector);
        const dropContainer = dropTarget?.closest(this.containerSelector);
        const dragTarget = e.target.closest(this.dragSelector);
        if (!dropTarget && !dragTarget) return;

        e.preventDefault();

        /*
        Sort 처리
        */
        if (
            this.dragItem &&
            dragTarget &&
            this.dragItem !== dragTarget
        ) {
            const parent = dragTarget.parentElement;

            if (parent.matches(this.dropSelector)) {
              const rect = dragTarget.getBoundingClientRect();
              const next = (e.clientY - rect.top) <(rect.height / 2);

              parent.insertBefore(
                this.placeholder,
                next ? dragTarget : dragTarget.nextSibling
              );
            }
        }

        /*
        Drop Area Highlight
        */
        if(dropTarget){
          dropTarget.classList.add('drag-over');
        }
      }
    );

    document.addEventListener(
      'dragleave',
      e => {
        const dropTarget = e.target.closest(this.dropSelector);
        
        if(dropTarget){
          dropTarget.classList.remove('drag-over');
        }
      }
    );

    document.addEventListener(
      'drop',
      e => {
        let isSort = false;

        const dropTarget = e.target.closest(this.dropSelector);
        const dropContainer = dropTarget?.closest(this.containerSelector);

        if (!dropTarget) return;

        e.preventDefault();

        dropTarget.classList.remove('drag-over');
        if(!this.dragItem) return;

        /*
        DropArea 추가
        */
        if(!this.dragItem.parentElement.matches(this.dropSelector)){
            dropTarget.appendChild(this.dragItem);
        } else {
          /*
          Sort 완료
          */
          isSort = true;

          if(this.placeholder.parentElement){
            this.placeholder
              .parentElement
              .insertBefore(
                this.dragItem,
                this.placeholder
              );
          }

          const container = this.dragItem.closest(this.containerSelector);

          this.emit(
              'sort',
              {
                item: this.dragItem,
                group: container?.dataset.group ?? null
              }
          );
        }

        if(!isSort){
          this.emit(
            'drop',
            {
              dragItem:this.dragItem,
              dropTarget,
              dropContainer,
              group: dropContainer?.dataset.group ?? null,
              count: this.getItemCount(dropTarget)
            }
          );
        }
      }
    );
  }

  /*
  ==========================
  Delete
  ==========================
  */
  bindDelete(){
    document.addEventListener(
      'click',
      e => {
        const button = e.target.closest(this.deleteSelector);
        if(!button) return;

        const item = button.closest(this.dragSelector);
        if(!item) return;

        const dropTarget = item.closest(this.dropSelector);
        const dropContainer = dropTarget?.closest(this.containerSelector);

        item.remove();
        this.emit(
          'delete',
          {
            item,
            dropTarget,
            dropContainer,
            group: dropContainer?.dataset.group ?? null,
            count: dropTarget ? this.getItemCount(dropTarget) : 0
          }
        );
      }
    );
  }

  getItemCount(dropTarget) {
    if(!dropTarget) return 0;

    return dropTarget.querySelectorAll(this.dragSelector).length;
  }
}

// DragDropManager
class DragDropManager {
  constructor(options = {}) {
    this.options = {
      root: options.root || document,
      autoScroll: options.autoScroll !== false,
      scrollEdge: options.scrollEdge || 80,
      scrollSpeed: options.scrollSpeed || 15,
      scrollContainer: options.scrollContainer || document.querySelector('.bodyPanel'),
      animation: options.animation !== false,
      animationDuration: options.animationDuration || 200,
      returnButton: options.returnButton !== false,
      // returnButtonText: options.returnButtonText || '리스트로 이동',
      returnButtonText: options.returnButtonText ?? '리스트로 이동',
      canDrop: options.canDrop || null,
      onDragStart: options.onDragStart || null,
      onDragMove: options.onDragMove || null,
      onDrop: options.onDrop || null,
      onDelete: options.onDelete || null,
      onReturn: options.onReturn || null,
      onChange: options.onChange || null
    };

    this.root = this.options.root;
    this.dragItems = [];
    this.dropAreas = [];
    this.areaMap = new Map();
    this.dragState = null;

    // item : origin 정보
    this.originMap = new WeakMap();
    this.state = {
      items: []
    };
    this.pointer = {
      x: 0,
      y: 0
    };

    this.boundMove = this.dragMove.bind(this);
    this.boundEnd = this.dragEnd.bind(this);
    this.boundCancel = this.dragCancel.bind(this);
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      return this;
    }

    this.cache();
    this.prepareItems();
    this.buildAreaMap();
    this.bindEvents();
    this.updateEmpty();
    this.syncState();
    this.initialized = true;

    return this;
  }

  refresh() {
    this.cache();
    this.prepareItems();
    this.buildAreaMap();
    this.syncState();
    this.updateEmpty();

    return this;
  }

  destroy() {
    document.removeEventListener('pointermove', this.boundMove);
    document.removeEventListener('pointerup', this.boundEnd);
    document.removeEventListener('pointercancel', this.boundCancel);

    this.dragState = null;
    this.initialized = false;
  }

  cache() {
    this.dragItems = [
      ...this.root.querySelectorAll('[data-ddm-item]')
    ];
    this.dropAreas = [
      ...this.root.querySelectorAll('[data-ddm-drop]')
    ];
  }

  prepareItems() {
    this.dragItems.forEach(item => {
      if (!item.dataset.ddmId) {
        item.dataset.ddmId = this.generateId();
      }
    });
  }

  buildAreaMap() {
    this.areaMap.clear();
    this.dropAreas.forEach(area => {
      this.areaMap.set(
        this.getAreaId(area),
        area
      );
    });
  }

  getAreaId(area) {
    return area.dataset.ddmDrop || 'default';
  }

  getArea(element) {
    if (!element) {
      return null;
    }

    return element.closest('[data-ddm-drop]');
  }

  syncState() {
    this.state = this.collectState();
  }

  collectState() {
    return {
      items:this.dragItems
      .filter(item => item.parentElement)
      .map(item => {
        const area = this.getArea(item.parentElement);

        return {
          id:item.dataset.ddmId,
          area:area ? this.getAreaId(area) : 'default',
          index:[
            ...item.parentElement.children
          ].indexOf(item)
        };
      })
    };
  }

  // =====================
  // Events
  // =====================
  bindEvents() {
    this.root.addEventListener(
      'pointerdown',
      this.handlePointerDown.bind(this)
    );

    this.root.addEventListener(
      'click',
      this.handleClick.bind(this)
    );
  }

  handlePointerDown(event) {
    const handle = event.target.closest('[data-ddm-handle]');
    if (!handle) {
      return;
    }

    const item = handle.closest('[data-ddm-item]');
    if (!item) {
      return;
    }

    event.preventDefault();
    this.dragStart(event, item);
  }

  handleClick(event) {
    const deleteButton = event.target.closest('[data-ddm-delete]');

    if (deleteButton) {
      this.deleteItem(
        deleteButton.closest('[data-ddm-item]')
      );
      return;
    }

    const returnButton = event.target.closest('[data-ddm-return]');
    if (returnButton) {
      this.restoreItem(
          returnButton.closest('[data-ddm-item]')
      );
    }
  }

  // =====================
  // Drag Start
  // =====================
  dragStart(event, item) {
    if (!this.originMap.has(item)) {
      this.originMap.set(
        item,
        this.createOrigin(item)
      );
    }

    this.dragState = {
      item,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null,
      placeholder: null,
      from: this.getItemPosition(item)
    };

    item.classList.add('ddm-is-drag-start');

    document.addEventListener(
      'pointermove',
      this.boundMove
    );

    document.addEventListener(
      'pointerup',
      this.boundEnd,
      { once:true }
    );

    document.addEventListener(
      'pointercancel',
      this.boundCancel,
      { once:true }
  );

    if (this.options.onDragStart) {
      this.options.onDragStart(item);
    }
  }

  createOrigin(item) {
    const parent = item.parentElement;
    const items = [
      ...parent.children
    ];

    const index = items.indexOf(item);
    const before = items[index - 1];
    const after = items[index + 1];

    return {
      parent,
      index,
      beforeId: before ? before.dataset.ddmId : null,
      afterId: after ? after.dataset.ddmId : null
    };
  }

  // =====================
  // Drag Move
  // =====================
  dragMove(event) {
    const state = this.dragState;

    if (!state) {
      return;
    }

    this.updatePointer(event);

    if (!state.moved && this.isMovedEnough()) {
      this.startDragging();
    }

    if (!state.moved) {
      return;
    }

    this.updateGhost();
    this.updateDropTarget();
    this.updatePlaceholder();

    if (this.options.autoScroll) {
      this.updateAutoScroll();
    }


    if (this.options.onDragMove) {
      this.options.onDragMove(state.item);
    }
  }

  updatePointer(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  }

  isMovedEnough() {
    const state = this.dragState;

    return (
      Math.abs(this.pointer.x - state.startX) + Math.abs(this.pointer.y - state.startY)) > 5;
  }

  startDragging() {
    const state = this.dragState;
    const item = state.item;

    state.moved = true;
    item.classList.remove('ddm-is-drag-start');
    item.classList.add('ddm-is-dragging');
    state.placeholder = this.createPlaceholder(item);
    item.parentElement.insertBefore(
      state.placeholder,
      item
    );

    state.ghost = this.createGhost(item);
    // item.style.visibility = 'hidden';
    !item.classList.contains('ddm-ghost') && (item.style.visibility = 'hidden');
  }

  // =====================
  // Animation
  // =====================
  animateItems(items) {
    if (!this.options.animation) {
      return;
    }

    items.forEach(item => {
      item.style.transitionDuration = `${this.options.animationDuration}ms`;
      item.classList.add('ddm-is-moving');
    });

    requestAnimationFrame(() => {
      items.forEach(item => {
        item.classList.remove('ddm-is-moving');
      });
    });
  }

  // =====================
  // Drop Target
  // =====================
  updateDropTarget() {
    this.clearDropHover();

    const area = this.getDropArea();
    if (area) {
      area.classList.add('ddm-is-over');
    }
  }

  updatePlaceholder() {
    const state = this.dragState;
    const area = this.getDropArea();

    if (
        !state ||
        !area ||
        !state.placeholder
    ) {
        // this.removePlaceholder();
        return;
    }

    if (!this.validateDrop(state.item, area)) {
        this.removePlaceholder();
        return;
    }

    const list = area.querySelector('[data-ddm-list]') || area;
    const items = [
      ...list.querySelectorAll('[data-ddm-item]')
    ].filter(item => item !== state.item);

    const movingItems = [
      ...items
    ];

    let inserted = false;

    items.forEach(item => {
      if (inserted) {
        return;
      }

      const rect = item.getBoundingClientRect();

      if (this.pointer.y < rect.top + rect.height / 2) {
        this.animateItems(movingItems);
        list.insertBefore(
          state.placeholder,
          item
        );

        inserted = true;
      }
    });

    if (!inserted) {
      this.animateItems(movingItems);

      if (
        state.placeholder &&
        state.placeholder.nodeType === Node.ELEMENT_NODE
      ) {
        list.appendChild(
          state.placeholder
        );
      }
    }
  }

  getDropArea() {
    return this.dropAreas.find(area => {
      const rect = area.getBoundingClientRect();

      return (
        this.pointer.x >= rect.left &&
        this.pointer.x <= rect.right &&
        this.pointer.y >= rect.top &&
        this.pointer.y <= rect.bottom
      );
    }) || null;
  }

  validateDrop(item, area) {
    if (!this.options.canDrop) {
      return true;
    }

    return this.options.canDrop(
      item,
      area
    );
  }

  clearDropHover() {
    this.dropAreas.forEach(area => {
      area.classList.remove('ddm-is-over');
    });
  }

  // =====================
  // Drag End
  // =====================
  dragEnd() {
    const state = this.dragState;

    if (!state) {
      return;
    }

    console.log('End', {
      moved:state.moved,
      area:this.getDropArea(),
      placeholder:state.placeholder,
      aaa: state.moved
    });

    const item = state.item;
    const area = this.getDropArea();

    if (
      state.moved &&
      area &&
      state.placeholder &&
      this.validateDrop(item, area)
    ) {
      this.processDrop(item);
    } else {
      this.restoreOrigin(item);
    }

    this.cleanupDrag();
    this.clearDropHover();
    this.syncState();
    this.updateEmpty();
  }

  processDrop(item) {
    const state = this.dragState;
    const placeholder = state.placeholder;

    if (
      !placeholder ||
      !placeholder.parentElement
    ) {
      return;
    }

    const from = state.from;

    this.animateItems([
      ...placeholder.parentElement.querySelectorAll(
        '[data-ddm-item]'
      )
    ]);

    placeholder.parentElement.insertBefore(
      item,
      placeholder
    );

    this.removePlaceholder();

    item.style.visibility = '';

    if (this.getArea(item.parentElement)) {
      this.createReturnButton(item);
    } else {
      this.removeReturnButton(item);
    }

    this.emitChange({
      type:'move',
      item,
      id:item.dataset.ddmId,
      from,
      to:this.getItemPosition(item)
    });

    if (this.options.onDrop) {
      this.options.onDrop(item);
    }
  }

  // =====================
  // Restore
  // =====================
  restoreOrigin(item) {
    const origin = this.originMap.get(item);

    if (!origin || !origin.parent) {
      return;
    }

    const parent = origin.parent;
    const afterItem = origin.afterId ? parent.querySelector(`[data-ddm-id="${origin.afterId}"]`) : null;
    const beforeItem = origin.beforeId ? parent.querySelector(`[data-ddm-id="${origin.beforeId}"]`) : null;

    if (afterItem) {
      parent.insertBefore(
        item,
        afterItem
      );
    } else if (beforeItem) {
      parent.insertBefore(
        item,
        beforeItem.nextSibling
      );
    } else {
      const children = [
        ...parent.children
      ].filter(
        child => child !== item
      );

      const target =
        children[origin.index];

      if (target) {
        parent.insertBefore(
          item,
          target
        );
      } else {
        parent.appendChild(item);
      }
    }

    this.removeReturnButton(item);
    this.emitChange({
      type:'return',
      item,
      id:item.dataset.ddmId,
      to:this.getItemPosition(item)
    });

    if (this.options.onReturn) {
      this.options.onReturn(item);
    }
  }

  restoreItem(item) {
    if (!item) {
      return;
    }

    const target = this.dragItems.find(current => current.dataset.ddmId === item.dataset.ddmId);
    if (!target) {
      return;
    }

    this.restoreOrigin(target);
    this.syncState();
    this.updateEmpty();
  }

  canDrop(item, area) {
    if (!this.events.canDrop) {
      return true;
    }

    return this.events.canDrop(
      item,
      area
    );
  }

  // =====================
  // Return Button
  // =====================
  createReturnButton(item) {
    // 옵션이 꺼져있으면 생성하지 않음
    if (!this.options.returnButton) {
      return;
    }

    if (item.querySelector('[data-ddm-return]')) {
      return;
    }

    const button = document.createElement('button');

    button.type = 'button';
    button.dataset.ddmReturn = '';
    button.textContent = this.options.returnButtonText;

    item.appendChild(button);
  }

  removeReturnButton(item) {
    const button = item.querySelector('[data-ddm-return]');

    if (button) {
      button.remove();
    }
  }

  // =====================
  // Delete
  // =====================
  deleteItem(item) {
    if (!item) {
      return;
    }

    this.originMap.delete(item);
    item.remove();

    this.dragItems = this.dragItems.filter(target => target !== item);
    this.syncState();
    this.updateEmpty();
    this.emitChange({
      type:'delete',
      item,
      id:item.dataset.ddmId,
      to:null
    });

    if (this.options.onDelete) {
      this.options.onDelete(item);
    }
  }

  // =====================
  // Data API
  // =====================
  getData() {
    return structuredClone(
      this.state
    );
  }

  getItemData(id) {
    const item = this.root.querySelector(`[data-ddm-id="${id}"]`);

    if (!item) {
      return null;
    }

    return {
      id:item.dataset.ddmId,
      ...this.getItemPosition(item)
    };
  }

  setData(data, options = {}) {
    if (!data || !data.items) {
        return;
    }

    const silent = options.silent === true;
    const savedMap = new Map(
        data.items.map(item => [
            item.id,
            item
        ])
    );

    this.dragItems
    .filter(item => item.parentElement)
    .forEach(item => {
      const saved = savedMap.get(item.dataset.ddmId);

      // 저장 데이터가 없는 item은 유지
      if (!saved) {
          return;
      }

      const area = this.areaMap.get(saved.area);

      if (!area) {
        return;
      }

      const list = area.querySelector('[data-ddm-list]') || area;
      const items = [
        ...list.querySelectorAll(
          '[data-ddm-item]'
        )
      ].filter(target => target !== item);

      const target = items[saved.index];
      if (target) {
        list.insertBefore(
          item,
          target
        );
      } else {
        list.appendChild(item);
      }

      if (saved.area !== 'default') {
        this.createReturnButton(item);
      } else {
        this.removeReturnButton(item);
      }
    });

    this.syncState();
    this.updateEmpty();

    if (!silent) {
      this.emitChange({
        type:'restore',
        data:this.state
      });
    }
  }

  clear(options = {}) {
    const silent = options.silent === true;

    this.dragItems.forEach(item => {
      this.restoreOrigin(item);
    });

    this.syncState();
    this.updateEmpty();

    if (!silent) {
      this.emitChange({
        type:'clear',
        data:this.state
      });
      }
  }

  // =====================
  // Cleanup
  // =====================
  cleanupDrag() {
    const state = this.dragState;

    if (!state) {
      return;
    }

    const item = state.item;
    item.classList.remove(
      'ddm-is-drag-start',
      'ddm-is-dragging'
    );

    item.style.visibility = '';
    this.removePlaceholder();

    if (state.ghost) {
      state.ghost.remove();
    }

    document.removeEventListener(
      'pointermove',
      this.boundMove
    );
    this.dragState = null;
  }

  dragCancel() {
    const state = this.dragState;

    if (!state) {
      return;
    }

    this.restoreOrigin(state.item);
    this.cleanupDrag();
    this.clearDropHover();
    this.syncState();
    this.updateEmpty();
  }

  removePlaceholder() {
    const placeholder = this.dragState?.placeholder;

    if (placeholder && placeholder.parentElement) {
      placeholder.remove();
    }

    if (this.dragState) {
      this.dragState.placeholder = null;
    }
  }

  // =====================
  // Auto Scroll
  // =====================
  // updateAutoScroll() {
  //   if (!this.options.autoScroll) {
  //     return;
  //   }

  //   const edge = this.options.scrollEdge;
  //   const speed = this.options.scrollSpeed;
  //   const height = window.innerHeight;

  //   if (this.pointer.y < edge) {
  //     window.scrollBy(0, -speed);
  //   } else if (this.pointer.y > height - edge) {
  //     window.scrollBy(0, speed);
  //   }
  // }
  updateAutoScroll() {
    const container = this.options.scrollContainer;

    if (!container) {
      return;
    }

    const edge = this.options.scrollEdge;
    const speed = this.options.scrollSpeed;

    const rect = container.getBoundingClientRect();
    const pointerY = this.pointer.y;

    if (pointerY < rect.top + edge) {
      container.scrollTop -= speed;
    } else if (pointerY > rect.bottom - edge) {
      container.scrollTop += speed;
    }
  }

  // =====================
  // Empty
  // =====================
  updateEmpty() {
    this.dropAreas.forEach(area => {
      const list = area.querySelector('[data-ddm-list]') || area;
      const hasItem = list.querySelector('[data-ddm-item]');

      area.dataset.ddmEmpty = hasItem ? 'false' : 'true';
    });
  }

  // =====================
  // Event API
  // =====================
  emitChange(detail) {
    if (!this.options.onChange) {
      return;
    }

    this.options.onChange(detail);
  }

  // =====================
  // Utility
  // =====================
  createGhost(item) {
    const ghost = item.cloneNode(true);
    const rect = item.getBoundingClientRect();

    ghost.classList.add('ddm-ghost');

    Object.assign(
      ghost.style,
      {
        width:`${rect.width}px`,
        height:`${rect.height}px`,
        position:'fixed',
        left:`${rect.left}px`,
        top:`${rect.top}px`,
        zIndex:99999,
        pointerEvents:'none'
      }
    );
    // document.body.appendChild(ghost);
    item.after(ghost);

    return ghost;
  }

  updateGhost() {
    const ghost = this.dragState?.ghost;

    if (!ghost) {
      return;
    }

    ghost.style.left = `${this.pointer.x - 15}px`;
    ghost.style.top = `${this.pointer.y - 15}px`;
  }

  createPlaceholder(item) {
    const placeholder = document.createElement('div');

    placeholder.className = 'ddm-placeholder';
    placeholder.style.height = `${item.offsetHeight}px`;

    return placeholder;
  }

  getItemPosition(item) {
    const area = this.getArea(item.parentElement);

    return {
      area: area ? this.getAreaId(area) : 'default',
      index:[
          ...item.parentElement.children
      ].indexOf(item)
    };
  }

  generateId() {
    return `ddm-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }
}





//  ==================================================
// onclick

// toggleGroup
const toggleGroup = (button, groupName, displayType) => {
  const elements = document.querySelectorAll(
      `[data-toggleGroup="${groupName}"]`
  );

  if (!elements.length) return;

  const hide =
      getComputedStyle(elements[0]).display !== 'none';

  elements.forEach(element => {
      if (!element.dataset.originalDisplay) {
          element.dataset.originalDisplay =
              displayType || getComputedStyle(element).display;
      }

      element.style.display = hide
          ? 'none'
          : element.dataset.originalDisplay;
  });

  // 버튼 클래스 토글
  button.classList.toggle('isExpand', !hide);
  button.classList.toggle('isCollapse', hide);
};





// ==================================================
// 단순 레이아웃 참고를 위해 임시로 만든

// toggleContent
const toggleContent = type => {
  const box1 = document.querySelector('.caseA');
  const box2 = document.querySelector('.caseB');

  box1.style.display = type === 1 ? 'flex' : 'none';
  box2.style.display = type === 2 ? 'flex' : 'none';
};

// panel / open
const openPanel = (obj) => {
  const target = document.querySelector(`.${obj}`);
  
  if (!target) { return; }
  target.classList.add('isOpen');
}

// panel / close
const closePanel = (obj) => {
  const target = document.querySelector(`.${obj}`);
  
  if (!target) { return; }
  target.classList.remove('isOpen');
  target.style.width = '';
}
