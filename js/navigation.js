/* =============================================
   MULTI-PAGE SPA NAVIGATION & LIQUID GLASS ENGINE
   ============================================= */

class PageNavigation {
  constructor() {
    this.navItems        = document.querySelectorAll('.nav-item[data-page]');
    this.pageViews       = document.querySelectorAll('.page-view');
    this.siteMain        = document.querySelector('.site-main');
    this.pageOrder       = ['home', 'about', 'skills', 'projects', 'playground', 'experience', 'contact'];
    this.currentPage     = 'home';
    this.isNavSliding    = false;
    this.justDragged     = false;
    this.lastScrollTime  = 0;
    this.slideEndTimer   = null;
    this.wheelBlurTimer  = null;

    this.init();
  }

  init() {
    // 1. Navigation item clicks (desktop & mobile)
    document.querySelectorAll('[data-page]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        if (this.justDragged) return;
        e.preventDefault();
        const targetPage = trigger.dataset.page;
        if (targetPage) {
          this.switchPage(targetPage, true, true);
        }
      });
    });

    // 2. Liquid Glass Mouse Refraction on Navigation
    this.initLiquidGlassHover();

    // 3. Hold and Drag Navigation on Menu Bar (Interactive Scrubbing with Live Blur)
    this.initHoldAndDragNavigation();

    // 4. Full Page Drag / Swipe Navigation
    this.initPageDragNavigation();

    // 5. Ultra-Smooth Menu Bar & Full Page Wheel Scroll Navigation
    this.initMenuScrollNavigation();

    // 6. Initialize dynamic Liquid Glass Indicator Pill & Keep Aligned on Scroll/Resize
    window.addEventListener('resize', () => this.updateLiquidPill(this.currentPage, true));
    
    const desktopNav = document.querySelector('.site-nav');
    if (desktopNav) {
      desktopNav.addEventListener('scroll', () => {
        this.updateLiquidPill(this.currentPage, true);
      }, { passive: true });
    }

    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
      mobileNav.addEventListener('scroll', () => {
        this.updateLiquidPill(this.currentPage, true);
      }, { passive: true });
    }

    // 7. Browser Back/Forward navigation via Hash
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== this.currentPage) {
        this.switchPage(hash, false, true);
      }
    });

    // 8. Initial page load from Hash or default 'home'
    const initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash && document.getElementById(`page-${initialHash}`)) {
      this.switchPage(initialHash, false, false);
    } else {
      this.switchPage('home', false, false);
    }

    setTimeout(() => this.updateLiquidPill(this.currentPage, true), 50);
  }

  /* ─── LIVE BLUR ENGINE: START / PREVIEW / STOP SLIDING ─── */
  startMenuSlide() {
    this.isNavSliding = true;
    clearTimeout(this.slideEndTimer);
    clearTimeout(this.wheelBlurTimer);
    clearTimeout(this.hoverBlurTimer);

    document.body.classList.add('is-sliding-nav');
    if (this.siteMain) {
      this.siteMain.classList.add('nav-blur-active');
    }
  }

  previewPageWhileSliding(targetPageId) {
    if (!targetPageId || targetPageId === this.currentPage) return;

    const targetPageEl = document.getElementById(`page-${targetPageId}`);
    if (!targetPageEl) return;

    this.currentPage = targetPageId;

    // Switch active view instantly under smooth GPU opacity
    this.pageViews.forEach(page => {
      if (page.id === `page-${targetPageId}`) {
        page.classList.add('active');
        page.scrollTop = 0;
      } else {
        page.classList.remove('active');
      }
    });

    // Update nav active button highlights
    this.navItems.forEach(item => {
      const isActive = item.dataset.page === targetPageId;
      item.classList.toggle('active', isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  stopMenuSlide(finalPageId = null) {
    const targetPage = finalPageId || this.currentPage;

    if (targetPage && targetPage !== this.currentPage) {
      this.switchPage(targetPage, true, false);
    }

    clearTimeout(this.slideEndTimer);
    this.slideEndTimer = setTimeout(() => {
      this.isNavSliding = false;
      document.body.classList.remove('is-sliding-nav');
      if (this.siteMain) {
        this.siteMain.classList.remove('nav-blur-active');
      }
    }, 40);
  }

  updateLiquidPill(pageId, immediate = false) {
    // 1. Desktop / Tablet Vertical Navigation Pill
    const activeDesktopBtn = document.querySelector(`.site-nav .nav-item[data-page="${pageId}"]`);
    const desktopPill = document.getElementById('nav-liquid-pill');
    if (activeDesktopBtn && desktopPill) {
      const navList = activeDesktopBtn.closest('.nav-items');
      if (navList) {
        const listRect = navList.getBoundingClientRect();
        const btnRect = activeDesktopBtn.getBoundingClientRect();
        const targetY = btnRect.top - listRect.top;

        if (activeDesktopBtn.offsetWidth > 0) {
          desktopPill.style.width = `${activeDesktopBtn.offsetWidth}px`;
          desktopPill.style.height = `${activeDesktopBtn.offsetHeight}px`;
        }

        desktopPill.style.transition = immediate
          ? 'none'
          : 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease';
        desktopPill.style.transform = `translate3d(0, ${targetY}px, 0)`;
        desktopPill.style.opacity = '1';
        this.lastPillY = targetY;
      }
    }

    // 2. Mobile / Small Tablet Horizontal Navigation Pill
    const activeMobileBtn = document.querySelector(`.mobile-nav .nav-item[data-page="${pageId}"]`);
    const mobilePill = document.getElementById('mobile-liquid-pill');
    if (activeMobileBtn && mobilePill) {
      const navList = activeMobileBtn.closest('.nav-items');
      if (navList) {
        const listRect = navList.getBoundingClientRect();
        const btnRect = activeMobileBtn.getBoundingClientRect();
        const targetX = btnRect.left - listRect.left;

        if (activeMobileBtn.offsetWidth > 0) {
          mobilePill.style.width = `${activeMobileBtn.offsetWidth}px`;
          mobilePill.style.height = `${activeMobileBtn.offsetHeight}px`;
        }

        mobilePill.style.transition = immediate
          ? 'none'
          : 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease';
        mobilePill.style.transform = `translate3d(${targetX}px, 0, 0)`;
        mobilePill.style.opacity = '1';
        this.lastMobilePillX = targetX;
      }
    }
  }

  switchPage(pageId, updateHash = true, animateBlur = false) {
    const targetPageEl = document.getElementById(`page-${pageId}`);
    if (!targetPageEl) {
      this.updateLiquidPill(pageId, false);
      return;
    }

    const isDifferent = pageId !== this.currentPage;
    this.currentPage = pageId;

    // Quick subtle blur pulse for discrete click / wheel transitions
    if (animateBlur && !this.isNavSliding && this.siteMain) {
      this.siteMain.classList.add('is-page-switching');
      setTimeout(() => {
        if (this.siteMain) this.siteMain.classList.remove('is-page-switching');
      }, 160);
    }

    // Update active class on all page views
    this.pageViews.forEach(page => {
      if (page.id === `page-${pageId}`) {
        page.classList.add('active');
        if (isDifferent) {
          page.scrollTop = 0; // reset inner scroll to top
        }
      } else {
        page.classList.remove('active');
      }
    });

    // Update active class on nav items
    this.navItems.forEach(item => {
      const isActive = item.dataset.page === pageId;
      item.classList.toggle('active', isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    // Smoothly scroll active buttons into view inside the navbar containers
    const activeDesktopBtn = document.querySelector(`.site-nav .nav-item[data-page="${pageId}"]`);
    if (activeDesktopBtn) {
      activeDesktopBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const activeMobileBtn = document.querySelector(`.mobile-nav .nav-item[data-page="${pageId}"]`);
    if (activeMobileBtn) {
      activeMobileBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // Move dynamic liquid pill indicator
    this.updateLiquidPill(pageId, false);

    // Update URL hash
    if (updateHash) {
      history.pushState(null, '', `#${pageId}`);
    }

    // Trigger page animations
    this.onPageEnter(targetPageEl, pageId);
  }

  onPageEnter(pageEl, pageId) {
    // Re-trigger entrance animations for elements inside the active page
    const animElements = pageEl.querySelectorAll('.animate-in');
    animElements.forEach(el => {
      el.classList.remove('is-visible');
      // Force layout reflow to restart transition
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.classList.add('is-visible');
      });
    });

    // Re-animate stats if entering home page
    if (pageId === 'home') {
      const counters = pageEl.querySelectorAll('[data-count-to]');
      counters.forEach(el => {
        if (window.countUpAnimatorInstance) {
          window.countUpAnimatorInstance.animateCounter(el);
        }
      });
    }
  }

  /* Dynamic fluid specular refraction tracking cursor position */
  initLiquidGlassHover() {
    this.navItems.forEach(item => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        item.style.setProperty('--mouse-x', `${x.toFixed(1)}%`);
        item.style.setProperty('--mouse-y', `${y.toFixed(1)}%`);
      }, { passive: true });

      item.addEventListener('mouseleave', () => {
        item.style.setProperty('--mouse-x', '40%');
        item.style.setProperty('--mouse-y', '30%');
      });
    });
  }

  /* Ultra-Smooth Wheel & Touch Navigation on Menu Bar & Page Boundaries */
  initMenuScrollNavigation() {
    let wheelAccumulator = 0;
    let wheelTimer = null;
    const cooldown = 280; // ms throttle for buttery-smooth step transitions

    const navigateStep = (direction) => {
      const now = Date.now();
      if (now - this.lastScrollTime < cooldown) return;

      const currentIndex = this.pageOrder.indexOf(this.currentPage);
      if (currentIndex === -1) return;

      const targetIndex = currentIndex + direction;
      if (targetIndex >= 0 && targetIndex < this.pageOrder.length) {
        this.lastScrollTime = now;
        this.switchPage(this.pageOrder[targetIndex], true, true);
      }
    };

    // 1. Mouse wheel directly over Desktop Navigation Bar or Mobile Navigation Bar
    const desktopNav = document.querySelector('.site-nav');
    const mobileNav  = document.querySelector('.mobile-nav');

    [desktopNav, mobileNav].forEach(navEl => {
      if (!navEl) return;
      navEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(delta) < 10) return;

        if (delta > 0) {
          navigateStep(1);
        } else {
          navigateStep(-1);
        }
      }, { passive: false });
    });

    // 2. Wheel over Page Content (smooth edge scroll / natural page deck transition)
    window.addEventListener('wheel', (e) => {
      // Don't intercept if lightbox modal is open
      if (document.querySelector('.creative-modal.active')) return;
      // Don't intercept inside form inputs, textareas or custom components
      if (e.target.closest('input, textarea, select')) return;

      const activePage = document.querySelector('.page-view.active');
      if (!activePage) return;

      const delta = e.deltaY;
      if (Math.abs(delta) < 15) return;

      const isScrollable = activePage.scrollHeight > activePage.clientHeight + 6;

      if (!isScrollable) {
        wheelAccumulator += delta;
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => { wheelAccumulator = 0; }, 180);

        if (wheelAccumulator > 38) {
          wheelAccumulator = 0;
          navigateStep(1);
        } else if (wheelAccumulator < -38) {
          wheelAccumulator = 0;
          navigateStep(-1);
        }
      } else {
        const isAtTop = activePage.scrollTop <= 2;
        const isAtBottom = Math.ceil(activePage.scrollTop + activePage.clientHeight) >= activePage.scrollHeight - 4;

        if (delta > 0 && isAtBottom) {
          wheelAccumulator += delta;
          clearTimeout(wheelTimer);
          wheelTimer = setTimeout(() => { wheelAccumulator = 0; }, 180);

          if (wheelAccumulator > 55) {
            wheelAccumulator = 0;
            navigateStep(1);
          }
        } else if (delta < 0 && isAtTop) {
          wheelAccumulator += delta;
          clearTimeout(wheelTimer);
          wheelTimer = setTimeout(() => { wheelAccumulator = 0; }, 180);

          if (wheelAccumulator < -55) {
            wheelAccumulator = 0;
            navigateStep(-1);
          }
        } else {
          wheelAccumulator = 0;
        }
      }
    }, { passive: true });

    // 3. Touch swipe gestures on Navigation Bars
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const attachNavTouch = (el, isHorizontal) => {
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        if (!e.touches.length) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }, { passive: true });

      el.addEventListener('touchmove', (e) => {
        if (!e.touches.length) return;
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (deltaX > 6 || deltaY > 6) {
          this.startMenuSlide();
        }
      }, { passive: true });

      el.addEventListener('touchend', (e) => {
        if (!e.changedTouches.length) {
          this.stopMenuSlide();
          return;
        }
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;
        const elapsed = Date.now() - touchStartTime;

        if (elapsed > 650) {
          this.stopMenuSlide();
          return; // ignore long press
        }

        if (isHorizontal) {
          if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY)) {
            navigateStep(deltaX > 0 ? 1 : -1, true);
          } else {
            this.stopMenuSlide();
          }
        } else {
          if (Math.abs(deltaY) > 28 && Math.abs(deltaY) > Math.abs(deltaX)) {
            navigateStep(deltaY > 0 ? 1 : -1, true);
          } else {
            this.stopMenuSlide();
          }
        }
      }, { passive: true });
    };

    attachNavTouch(desktopNav, false);
    attachNavTouch(mobileNav, true);

    // 4. Keyboard Arrow / Page Down / Page Up Navigation
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (document.querySelector('.creative-modal.active')) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        const activePage = document.querySelector('.page-view.active');
        const isAtBottom = !activePage || (Math.ceil(activePage.scrollTop + activePage.clientHeight) >= activePage.scrollHeight - 6);
        if (isAtBottom) {
          navigateStep(1, false);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        const activePage = document.querySelector('.page-view.active');
        const isAtTop = !activePage || activePage.scrollTop <= 2;
        if (isAtTop) {
          navigateStep(-1, false);
        }
      }
    });
  }

  /* ─── HOLD & DRAG TO SWITCH MENU (Desktop & Mobile) ─── */
  initHoldAndDragNavigation() {
    const desktopNav = document.querySelector('.site-nav');
    const mobileNav  = document.querySelector('.mobile-nav');
    this.justDragged = false;

    const setupNavDrag = (navEl, isHorizontal = false) => {
      if (!navEl) return;

      let isPointerDown = false;
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let downTargetBtn = null;
      let currentHoverBtn = null;

      const getNearestBtn = (clientY, clientX) => {
        const buttons = Array.from(navEl.querySelectorAll('.nav-item[data-page]'));
        let closest = null;
        let minDistance = Infinity;

        buttons.forEach(btn => {
          const rect = btn.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const centerX = rect.left + rect.width / 2;
          const dist = isHorizontal ? Math.abs(clientX - centerX) : Math.abs(clientY - centerY);

          if (dist < minDistance) {
            minDistance = dist;
            closest = btn;
          }
        });

        return closest;
      };

      const updatePillDuringDrag = (clientY, clientX) => {
        const navList = navEl.querySelector('.nav-items');
        if (!navList) return;
        const listRect = navList.getBoundingClientRect();

        if (isHorizontal) {
          const mobilePill = document.getElementById('mobile-liquid-pill');
          if (!mobilePill) return;
          const pillW = mobilePill.offsetWidth || 44;
          const rawX = clientX - listRect.left - (pillW / 2);
          const minX = 0;
          const maxX = Math.max(0, listRect.width - pillW);
          const clampedX = Math.max(minX, Math.min(maxX, rawX));

          mobilePill.style.transition = 'transform 20ms linear, opacity 150ms ease';
          mobilePill.style.transform = `translateX(${clampedX}px) scaleX(1.18) scaleY(0.92)`;
          mobilePill.style.opacity = '1';
        } else {
          const desktopPill = document.getElementById('nav-liquid-pill');
          if (!desktopPill) return;
          const pillH = desktopPill.offsetHeight || 46;
          const rawY = clientY - listRect.top - (pillH / 2);
          const minY = 0;
          const maxY = Math.max(0, listRect.height - pillH);
          const clampedY = Math.max(minY, Math.min(maxY, rawY));

          desktopPill.style.transition = 'transform 20ms linear, opacity 150ms ease';
          desktopPill.style.transform = `translateY(${clampedY}px) scaleY(1.18) scaleX(0.92)`;
          desktopPill.style.opacity = '1';
        }
      };

      navEl.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        isPointerDown = true;
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        downTargetBtn = e.target.closest('[data-page]') || getNearestBtn(startY, startX);
        currentHoverBtn = downTargetBtn;
      });

      window.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;

        const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);
        const dragThreshold = e.pointerType === 'touch' ? 16 : 6;
        if (!isDragging && moveDist > dragThreshold) {
          isDragging = true;
          this.justDragged = true;
          navEl.classList.add('is-dragging');
          this.startMenuSlide();
        }

        if (isDragging) {
          updatePillDuringDrag(e.clientY, e.clientX);

          const nearest = getNearestBtn(e.clientY, e.clientX);
          if (nearest && nearest !== currentHoverBtn) {
            if (currentHoverBtn) currentHoverBtn.classList.remove('drag-hover');
            currentHoverBtn = nearest;
            currentHoverBtn.classList.add('drag-hover');

            const pageId = nearest.dataset.page;
            if (pageId) {
              this.previewPageWhileSliding(pageId);
            }

            if (navigator.vibrate) {
              try { navigator.vibrate(10); } catch (err) {}
            }
          }
        }
      }, { passive: true });

      const onPointerEnd = (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;

        const wasDragging = isDragging;
        isDragging = false;
        navEl.classList.remove('is-dragging');

        if (currentHoverBtn) {
          currentHoverBtn.classList.remove('drag-hover');
        }

        if (wasDragging) {
          // Dragged: activate the item nearest to release point
          const finalBtn = getNearestBtn(e.clientY, e.clientX);
          const finalPage = finalBtn?.dataset?.page || this.currentPage;
          this.stopMenuSlide(finalPage);
          setTimeout(() => { this.justDragged = false; }, 100);
        } else {
          // Normal click / tap: directly activate clicked button
          this.justDragged = false;
          const clickedBtn = downTargetBtn || e.target.closest('[data-page]');
          if (clickedBtn && clickedBtn.dataset.page) {
            this.switchPage(clickedBtn.dataset.page, true, true);
          }
        }
      };

      window.addEventListener('pointerup', onPointerEnd);
      window.addEventListener('pointercancel', onPointerEnd);
    };

    setupNavDrag(desktopNav, false);
    setupNavDrag(mobileNav, true);
  }

  /* ─── FULL-PAGE DRAG / SWIPE TO SWITCH MENU ─── */
  initPageDragNavigation() {
    let isDraggingPage = false;
    let startY = 0;
    let startX = 0;
    let startTime = 0;

    window.addEventListener('pointerdown', (e) => {
      // Don't drag if inside navigation bars, modal, interactive elements
      if (e.target.closest('.site-nav, .mobile-nav, .creative-modal, input, textarea, select, button, a')) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const activePage = document.querySelector('.page-view.active');
      if (!activePage) return;

      isDraggingPage = true;
      startY = e.clientY;
      startX = e.clientX;
      startTime = Date.now();
    });

    window.addEventListener('pointerup', (e) => {
      if (!isDraggingPage) return;
      isDraggingPage = false;

      const diffY = startY - e.clientY;
      const diffX = startX - e.clientX;
      const elapsed = Date.now() - startTime;

      if (elapsed > 750) return; // ignore long hold

      const activePage = document.querySelector('.page-view.active');
      const isAtTop = !activePage || activePage.scrollTop <= 4;
      const isAtBottom = !activePage || (Math.ceil(activePage.scrollTop + activePage.clientHeight) >= activePage.scrollHeight - 6);

      const isVerticalSwipe = Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX);
      const isHorizontalSwipe = Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY);

      // Only perform vertical boundary drag-navigation on desktop mouse;
      // On mobile/Android touch, allow smooth native page scrolling without accidental page jumps
      if (isVerticalSwipe && e.pointerType !== 'touch') {
        if (diffY > 60 && isAtBottom) {
          // Dragged/swiped up -> switch to next page
          const currentIndex = this.pageOrder.indexOf(this.currentPage);
          if (currentIndex < this.pageOrder.length - 1) {
            this.switchPage(this.pageOrder[currentIndex + 1], true);
          }
        } else if (diffY < -60 && isAtTop) {
          // Dragged/swiped down -> switch to prev page
          const currentIndex = this.pageOrder.indexOf(this.currentPage);
          if (currentIndex > 0) {
            this.switchPage(this.pageOrder[currentIndex - 1], true);
          }
        }
      } else if (isHorizontalSwipe && Math.abs(diffX) > 65) {
        if (diffX > 0) {
          // Swiped left -> next page
          const currentIndex = this.pageOrder.indexOf(this.currentPage);
          if (currentIndex < this.pageOrder.length - 1) {
            this.switchPage(this.pageOrder[currentIndex + 1], true);
          }
        } else if (diffX < 0) {
          // Swiped right -> prev page
          const currentIndex = this.pageOrder.indexOf(this.currentPage);
          if (currentIndex > 0) {
            this.switchPage(this.pageOrder[currentIndex - 1], true);
          }
        }
      }
    });

    window.addEventListener('pointercancel', () => {
      isDraggingPage = false;
    });
  }
}


/* =============================================
   PROJECTS CATEGORY FILTER
   ============================================= */

class ProjectsFilter {
  constructor() {
    this.filterPills = document.querySelectorAll('.filter-pill');
    this.projectItems = document.querySelectorAll('.project-card-item');
    if (!this.filterPills.length || !this.projectItems.length) return;

    this.init();
  }

  init() {
    this.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const filter = pill.dataset.filter;
        this.filterPills.forEach(p => p.classList.toggle('active', p === pill));

        this.projectItems.forEach(item => {
          const categoryStr = item.dataset.category || '';
          const cats = categoryStr.split(/\s+/);
          const isMatch = filter === 'all' || cats.includes(filter);

          if (isMatch) {
            item.style.display = '';
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            });
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.96)';
            setTimeout(() => {
              const activeFilter = document.querySelector('.filter-pill.active')?.dataset.filter;
              const currentCats = (item.dataset.category || '').split(/\s+/);
              if (activeFilter !== 'all' && !currentCats.includes(activeFilter)) {
                item.style.display = 'none';
              }
            }, 250);
          }
        });
      });
    });
  }
}


/* =============================================
   KUALA LUMPUR LIVE TIME CLOCK (About & Hero)
   ============================================= */

function initKLClock() {
  const clockElements = document.querySelectorAll('#kl-clock, .hero-kl-clock');
  if (!clockElements.length) return;

  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    clockElements.forEach(el => {
      el.textContent = timeStr;
    });
  }

  update();
  setInterval(update, 1000);
}





/* =============================================
   INTERACTIVE CONTACT FORM & TOAST
   ============================================= */

function initContactForm() {
  const form = document.getElementById('contact-form');
  const toast = document.getElementById('contact-toast');
  const submitBtn = document.getElementById('contact-submit-btn');
  if (!form || !toast) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending...</span>`;
    }

    setTimeout(() => {
      // Show toast
      toast.classList.add('show');
      form.reset();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Sent Successfully!</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        `;
        setTimeout(() => {
          submitBtn.innerHTML = `
            <span>Send Message</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          `;
        }, 3000);
      }

      setTimeout(() => {
        toast.classList.remove('show');
      }, 4500);
    }, 800);
  });
}


/* =============================================
   SCROLL ENTRANCE ANIMATIONS (Per-Page)
   ============================================= */

class ScrollAnimator {
  constructor() {
    this.elements = document.querySelectorAll('.animate-in');
    this.init();
  }

  init() {
    // Reveal all initially visible elements
    this.elements.forEach(el => el.classList.add('is-visible'));
  }
}


/* =============================================
   SUBTLE MOUSE PARALLAX
   ============================================= */

class ParallaxBg {
  constructor() {
    this.bgPhoto = document.querySelector('.site-bg__photo');
    if (!this.bgPhoto) return;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.strength = 8;
    this.isTicking = false;
    this.init();
  }

  init() {
    // Disable continuous mouse parallax on touch devices / mobile to eliminate GPU overhead and battery drain
    if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      return;
    }

    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      this.targetX = ((e.clientX - cx) / cx) * this.strength;
      this.targetY = ((e.clientY - cy) / cy) * this.strength;
      if (!this.isTicking) {
        this.isTicking = true;
        requestAnimationFrame(() => this.tick());
      }
    }, { passive: true });
  }

  tick() {
    this.x += (this.targetX - this.x) * 0.05;
    this.y += (this.targetY - this.y) * 0.05;
    this.bgPhoto.style.transform = `scale(1.05) translate(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px)`;

    // Only continue animation loop while motion is still settling; sleep when idle
    if (Math.abs(this.targetX - this.x) > 0.05 || Math.abs(this.targetY - this.y) > 0.05) {
      requestAnimationFrame(() => this.tick());
    } else {
      this.isTicking = false;
    }
  }
}


/* =============================================
   COUNTER ANIMATION
   ============================================= */

class CountUpAnimator {
  constructor() {
    this.counters = document.querySelectorAll('[data-count-to]');
    window.countUpAnimatorInstance = this;
    if (!this.counters.length) return;
    this.init();
  }

  init() {
    this.counters.forEach(el => this.animateCounter(el));
  }

  animateCounter(el) {
    const target   = parseInt(el.dataset.countTo, 10);
    const suffix   = el.dataset.suffix || '';
    const duration = 1200;
    const start    = performance.now();

    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      el.textContent = (current < 10 ? '0' : '') + current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }
}


/* =============================================
   GLASS AMBIENT TILT
   ============================================= */

class GlassTilt {
  constructor() {
    this.cards = document.querySelectorAll('.tilt-card');
    this.state = new Map();
    this.rafId = null;
    this.init();
  }

  init() {
    // Disable on mobile/touch screens: touch devices don't have hover tilt and it causes jitter & lag
    if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      return;
    }

    this.cards.forEach(card => {
      this.state.set(card, {
        currentRotX: 0,
        currentRotY: 0,
        targetRotX: 0,
        targetRotY: 0,
        isHovered: false
      });

      card.addEventListener('mousemove', (e) => {
        const data = this.state.get(card);
        if (!data) return;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        data.targetRotX = ((e.clientY - cy) / (rect.height / 2)) * -2.8;
        data.targetRotY = ((e.clientX - cx) / (rect.width / 2)) * 2.8;
        data.isHovered = true;
        this.requestTick();
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        const data = this.state.get(card);
        if (!data) return;
        data.targetRotX = 0;
        data.targetRotY = 0;
        data.isHovered = false;
        this.requestTick();
      });
    });
  }

  requestTick() {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.tick());
    }
  }

  tick() {
    let hasActiveMotion = false;

    this.cards.forEach(card => {
      const data = this.state.get(card);
      if (!data) return;

      const diffX = data.targetRotX - data.currentRotX;
      const diffY = data.targetRotY - data.currentRotY;

      if (Math.abs(diffX) > 0.01 || Math.abs(diffY) > 0.01) {
        hasActiveMotion = true;
        data.currentRotX += diffX * 0.14;
        data.currentRotY += diffY * 0.14;

        const lift = data.isHovered ? -4 : 0;
        const scale = data.isHovered ? 1.025 : 1;

        card.style.transform = `perspective(1000px) rotateX(${data.currentRotX.toFixed(2)}deg) rotateY(${data.currentRotY.toFixed(2)}deg) translate3d(0, ${lift}px, 0) scale(${scale})`;
      } else if (!data.isHovered && (Math.abs(data.currentRotX) > 0 || Math.abs(data.currentRotY) > 0)) {
        data.currentRotX = 0;
        data.currentRotY = 0;
        card.style.transform = '';
      }
    });

    if (hasActiveMotion) {
      this.rafId = requestAnimationFrame(() => this.tick());
    } else {
      this.rafId = null;
    }
  }
}


/* =============================================
   CURSOR TYPING EFFECT (Hero)
   ============================================= */

class TypingEffect {
  constructor(el, words, speed = 100) {
    if (!el) return;
    this.el    = el;
    this.words = words;
    this.speed = speed;
    this.wordIdx = 0;
    this.charIdx = 0;
    this.deleting = false;
    this.tick();
  }

  tick() {
    const word = this.words[this.wordIdx];
    if (!this.deleting) {
      this.el.textContent = word.slice(0, this.charIdx + 1);
      this.charIdx++;
      if (this.charIdx === word.length) {
        this.deleting = true;
        setTimeout(() => this.tick(), 2000);
        return;
      }
    } else {
      this.el.textContent = word.slice(0, this.charIdx - 1);
      this.charIdx--;
      if (this.charIdx === 0) {
        this.deleting = false;
        this.wordIdx  = (this.wordIdx + 1) % this.words.length;
      }
    }
    setTimeout(() => this.tick(), this.deleting ? this.speed / 2 : this.speed);
  }
}


/* =============================================
   DYNAMIC LIQUID GLASS CARD SPOTLIGHT SHINE
   Tracks cursor across glass cards, projecting realistic
   specular glare & illuminated border just like the navigation.
   ============================================= */

function initCardGlassShine() {
  const cardSelectors = [
    '.hero-flip-front',
    '.hero-flip-back',
    '.profile-card',
    '.home-toolkit-deck',
    '.about-main',
    '.about-info-card',
    '.featured-project',
    '.project-card',
    '.playground-item',
    '.contact-info-card',
    '.contact-form-card',
    '.glass-primary',
    '.glass-secondary'
  ];

  const cards = document.querySelectorAll(cardSelectors.join(', '));
  const pendingUpdates = new Map();
  let rafActive = false;

  function flushUpdates() {
    pendingUpdates.forEach((coords, card) => {
      card.style.setProperty('--card-mouse-x', `${coords.x}%`);
      card.style.setProperty('--card-mouse-y', `${coords.y}%`);
    });
    pendingUpdates.clear();
    rafActive = false;
  }

  cards.forEach(card => {
    // Avoid double injecting
    if (!card.querySelector(':scope > .glass-card-spotlight')) {
      const spotlight = document.createElement('div');
      spotlight.className = 'glass-card-spotlight';
      spotlight.setAttribute('aria-hidden', 'true');
      card.appendChild(spotlight);

      const borderGlow = document.createElement('div');
      borderGlow.className = 'glass-card-border-glow';
      borderGlow.setAttribute('aria-hidden', 'true');
      card.appendChild(borderGlow);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
      const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
      pendingUpdates.set(card, { x, y });
      if (!rafActive) {
        rafActive = true;
        requestAnimationFrame(flushUpdates);
      }
    }, { passive: true });

    card.addEventListener('mouseenter', () => {
      card.classList.add('has-card-hover');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('has-card-hover');
      card.style.setProperty('--card-mouse-x', '50%');
      card.style.setProperty('--card-mouse-y', '50%');
    });
  });
}


/* =============================================
   CREATIVE CORNER & MEDIA MODAL MANAGER
   Handles category filtering, video hover previews,
   and interactive modal (Image Lightbox & Video Player).
   ============================================= */

class CreativeCornerManager {
  constructor() {
    this.filterBtns  = document.querySelectorAll('[data-pg-filter]');
    this.items       = document.querySelectorAll('.playground-item');
    this.modal       = document.getElementById('creative-modal');
    this.modalBackdrop = document.getElementById('creative-modal-backdrop');
    this.modalClose  = document.getElementById('creative-modal-close');
    this.modalImgBox = document.getElementById('modal-img-box');
    this.modalImage  = document.getElementById('modal-image');
    this.modalVideoBox = document.getElementById('modal-video-box');
    this.modalVideo  = document.getElementById('modal-video');
    this.modalGalleryTabs = document.getElementById('modal-gallery-tabs');
    this.modalCat    = document.getElementById('modal-cat');
    this.modalBadge  = document.getElementById('modal-badge');
    this.modalTitle  = document.getElementById('modal-title');
    this.modalDesc   = document.getElementById('modal-desc');
    this.modalTools  = document.getElementById('modal-tools');
    this.modalOpenTab = document.getElementById('modal-open-tab-btn');

    this.init();
  }

  init() {
    this.initFilters();
    this.initHoverVideoPreviews();
    this.initModalTriggers();
    this.initModalControls();
  }

  /* 1. Category Filtering */
  initFilters() {
    if (!this.filterBtns.length || !this.items.length) return;

    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.pgFilter;
        this.filterBtns.forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        this.items.forEach(item => {
          const categoryStr = item.dataset.category || '';
          const cats = categoryStr.split(/\s+/);
          const isMatch = filter === 'all' || cats.includes(filter);

          if (isMatch) {
            item.style.display = '';
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = '';
            });
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.96)';
            setTimeout(() => {
              const currentActive = document.querySelector('[data-pg-filter].active')?.dataset.pgFilter;
              const currentCats = (item.dataset.category || '').split(/\s+/);
              if (currentActive !== 'all' && !currentCats.includes(currentActive)) {
                item.style.display = 'none';
              }
            }, 250);
          }
        });
      });
    });
  }

  /* 2. Hover video previews on video cards */
  initHoverVideoPreviews() {
    const videoCards = document.querySelectorAll('.playground-item.pg-card-video');
    videoCards.forEach(card => {
      const video = card.querySelector('video');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        video.play().catch(() => {});
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
      });
    });
  }

  /* 3. Opening modal on card click */
  initModalTriggers() {
    this.items.forEach(item => {
      const handleOpen = (e) => {
        e.preventDefault();
        this.openModal(item);
      };

      item.addEventListener('click', handleOpen);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openModal(item);
        }
      });
    });
  }

  openModal(item) {
    if (!this.modal) return;

    const mediaType      = item.dataset.mediaType || 'image';
    const mediaSrc       = item.dataset.mediaSrc || '';
    const galleryRaw     = item.dataset.mediaGallery || '';
    const titlesRaw      = item.dataset.mediaGalleryTitles || '';
    const galleryItems   = galleryRaw ? galleryRaw.split(',').map(s => s.trim()) : [];
    const galleryTitles  = titlesRaw ? titlesRaw.split(',').map(s => s.trim()) : [];
    const mediaTitle     = item.dataset.mediaTitle || item.querySelector('.playground-item__title')?.textContent || '';
    const mediaCat       = item.dataset.mediaCat || item.querySelector('.playground-item__cat')?.textContent || '';
    const mediaBadge     = item.dataset.mediaBadge || '';
    const mediaDesc      = item.dataset.mediaDesc || '';
    const mediaTools     = (item.dataset.mediaTools || '').split(',').map(t => t.trim()).filter(Boolean);

    // Update text fields
    if (this.modalTitle) this.modalTitle.textContent = mediaTitle;
    if (this.modalCat)   this.modalCat.textContent   = mediaCat;
    if (this.modalDesc)  this.modalDesc.textContent  = mediaDesc;

    if (this.modalBadge) {
      if (mediaBadge) {
        this.modalBadge.textContent = mediaBadge;
        this.modalBadge.style.display = 'inline-flex';
      } else {
        this.modalBadge.style.display = 'none';
      }
    }

    // Update tools list
    if (this.modalTools) {
      this.modalTools.innerHTML = '';
      mediaTools.forEach(tool => {
        const tag = document.createElement('span');
        tag.className = 'modal-tool-tag';
        tag.textContent = tool;
        this.modalTools.appendChild(tag);
      });
    }

    // Update action button
    if (this.modalOpenTab) {
      this.modalOpenTab.href = mediaSrc;
    }

    // Multi-image gallery switcher tabs
    if (this.modalGalleryTabs) {
      if (galleryItems.length > 1) {
        this.modalGalleryTabs.style.display = 'flex';
        this.modalGalleryTabs.innerHTML = '';
        galleryItems.forEach((src, idx) => {
          const btn = document.createElement('button');
          btn.className = `modal-gallery-tab-btn ${idx === 0 ? 'active' : ''}`;
          btn.type = 'button';
          btn.textContent = galleryTitles[idx] || `Poster 0${idx + 1}`;
          btn.addEventListener('click', () => {
            this.modalGalleryTabs.querySelectorAll('.modal-gallery-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (this.modalImage) {
              this.modalImage.src = src;
              this.modalImage.alt = galleryTitles[idx] || mediaTitle;
            }
            if (this.modalOpenTab) {
              this.modalOpenTab.href = src;
            }
          });
          this.modalGalleryTabs.appendChild(btn);
        });
      } else {
        this.modalGalleryTabs.style.display = 'none';
        this.modalGalleryTabs.innerHTML = '';
      }
    }

    // Configure media stage
    if (mediaType === 'video') {
      if (this.modalImgBox) this.modalImgBox.style.display = 'none';
      if (this.modalVideoBox) {
        this.modalVideoBox.style.display = 'flex';
        if (this.modalVideo) {
          this.modalVideo.src = mediaSrc;
          this.modalVideo.load();
          this.modalVideo.play().catch(() => {});
        }
      }
    } else {
      // Image
      if (this.modalVideoBox) {
        this.modalVideoBox.style.display = 'none';
        if (this.modalVideo) {
          this.modalVideo.pause();
          this.modalVideo.removeAttribute('src');
          this.modalVideo.load();
        }
      }
      if (this.modalImgBox) {
        this.modalImgBox.style.display = 'flex';
        if (this.modalImage) {
          this.modalImage.src = mediaSrc;
          this.modalImage.alt = mediaTitle;
        }
      }
    }

    // Show modal
    this.modal.classList.add('is-active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  /* 4. Modal Close Controls */
  initModalControls() {
    if (!this.modal) return;

    const closeModal = () => {
      this.modal.classList.remove('is-active');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (this.modalVideo) {
        this.modalVideo.pause();
        this.modalVideo.removeAttribute('src');
        this.modalVideo.load();
      }
    };

    if (this.modalClose) {
      this.modalClose.addEventListener('click', closeModal);
    }

    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-active')) {
        closeModal();
      }
    });
  }
}


/* =============================================
   CREDENTIAL MODAL & IN-PAGE SMOOTH SCROLL ENGINE
   ============================================= */

function initHomeSmoothScroll() {
  document.querySelectorAll('[data-scroll-to]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const targetSel = trigger.getAttribute('data-scroll-to');
      if (!targetSel) return;
      const targetEl = document.querySelector(targetSel);
      const pageHome = document.getElementById('page-home');
      if (targetEl && pageHome) {
        e.preventDefault();
        const targetOffset = targetEl.offsetTop - 24;
        pageHome.scrollTo({
          top: Math.max(0, targetOffset),
          behavior: 'smooth'
        });
      }
    });
  });
}

function initCredentialModal() {
  const modal = document.getElementById('cred-modal');
  if (!modal) return;

  const modalBackdrop = document.getElementById('cred-modal-backdrop');
  const modalClose = document.getElementById('cred-modal-close');
  const modalDismiss = document.getElementById('cred-modal-dismiss');
  const modalSeal = document.getElementById('cred-modal-seal');
  const modalBadge = document.getElementById('cred-modal-badge');
  const modalTitle = document.getElementById('cred-modal-title');
  const modalIssuer = document.getElementById('cred-modal-issuer');
  const modalCitation = document.getElementById('cred-modal-citation');
  const modalYear = document.getElementById('cred-spec-year');
  const modalCode = document.getElementById('cred-spec-code');
  const openPdfBtn = document.getElementById('cred-open-pdf');

  const credData = {
    'best-project': {
      seal: '🏆',
      badge: 'VERIFIED OFFICIAL ACADEMIC AWARD',
      title: 'Best Project Award (BreedLink)',
      issuer: 'Politeknik Ungku Omar (PUO) • Final Year Project',
      citation: 'Conferred for outstanding technical implementation, user experience design, and full-stack architecture in developing the BreedLink Cat Matchmaking Mobile Platform using React Native, Expo, and Supabase.',
      year: '2025',
      code: 'PUO-JTMK-2025-BEST01',
      pdf: 'assets/khairul_azizi_resume.pdf'
    },
    'high-distinction': {
      seal: '🥇',
      badge: 'OFFICIAL ACADEMIC EXCELLENCE',
      title: "Academic Excellence Award (Anugerah Ketua Jabatan)",
      issuer: 'Politeknik Ungku Omar (PUO) • High Distinction',
      citation: 'Awarded across consecutive academic semesters in recognition of continuous scholastic distinction, culminating in a final Diploma with High Distinction in Information Technology (CGPA 3.94).',
      year: '2023 – 2025',
      code: 'PUO-AKJ-HONORS-DIT',
      pdf: 'assets/khairul_azizi_resume.pdf'
    },
    'ice-jtmk': {
      seal: '🎨',
      badge: 'COMPETITION FIRST PLACE & GOLD MEDAL',
      title: 'ICE JTMK 2025 — 1st Place & Gold Award',
      issuer: 'Innovation & Computing Exhibition • Politeknik Ungku Omar',
      citation: 'Ranked 1st place in the software and mobile technology category for innovative matchmaking algorithms, clean mobile UI design, and production Supabase backend integration.',
      year: '2025',
      code: 'ICE-JTMK-2025-GOLD-01',
      pdf: 'assets/khairul_azizi_resume.pdf'
    },
    'apex-2025': {
      seal: '🚀',
      badge: 'APPLIED PROJECT INNOVATION HONORS',
      title: 'APEX 2025 Innovation Award',
      issuer: 'Applied Project & Exhibition Series',
      citation: 'Commended by academic and industry evaluators for commercial viability, modular software architecture, and robust database modeling.',
      year: '2025',
      code: 'APEX-2025-HONOR-KA',
      pdf: 'assets/khairul_azizi_resume.pdf'
    }
  };

  const openCredModal = (credId) => {
    const data = credData[credId];
    if (!data) return;

    if (modalSeal) modalSeal.textContent = data.seal;
    if (modalBadge) modalBadge.textContent = data.badge;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalIssuer) modalIssuer.textContent = data.issuer;
    if (modalCitation) modalCitation.textContent = data.citation;
    if (modalYear) modalYear.textContent = data.year;
    if (modalCode) modalCode.textContent = data.code;
    if (openPdfBtn) openPdfBtn.href = data.pdf;

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('is-active');
    });
    document.body.style.overflow = 'hidden';
  };

  const closeCredModal = () => {
    modal.classList.remove('is-active');
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 250);
  };

  document.querySelectorAll('[data-cred-trigger], [data-cred-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const credId = el.getAttribute('data-cred-id') || el.getAttribute('data-cred-trigger');
      if (credId) openCredModal(credId);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeCredModal);
  if (modalDismiss) modalDismiss.addEventListener('click', closeCredModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeCredModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeCredModal();
    }
  });
}


/* =============================================
   DOM READY INITIALIZATION
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  new PageNavigation();
  new ScrollAnimator();
  new ParallaxBg();
  new CountUpAnimator();
  new GlassTilt();
  new ProjectsFilter();
  new CreativeCornerManager();
  initKLClock();
  initContactForm();
  initCardGlassShine();
  initHomeSmoothScroll();
  initCredentialModal();

  // Typing effect on hero subtitle
  const typingEl = document.getElementById('hero-typing');
  if (typingEl) {
    new TypingEffect(typingEl, [
      'Computer Science Student',
      'Software Developer',
      'Full-Stack Developer',
      'Mobile App Specialist',
      'IT Specialist',
    ], 80);
  }
});



