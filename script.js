/* ==========================================================================
   script.js — behaviour for the advert page
   Add before </body>:   <script src="script.js" defer></script>

   1. Mobile menu (hamburger + drawer)
   2. Gallery: next arrow, swipe/scroll sync (dots + counter)
   3. Gallery lightbox: click any photo, arrows / keys / swipe
   4. Section nav: appears on scroll, click to jump, highlights current section
   5. "Back to top" buttons
   6. Save (heart) buttons, remembered in localStorage
   7. Share button
   8. "Read full description" expand / collapse
   ========================================================================== */
(function () {
    'use strict';

    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var smooth = reduceMotion ? 'auto' : 'smooth';

    /* ----------------------------------------------------------------------
       Small injected styles (lightbox + toast) so this file is self-contained
       ---------------------------------------------------------------------- */
    var style = document.createElement('style');
    style.textContent = [
        '.at-lb{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(5,8,21,.94)}',
        '.at-lb[hidden]{display:none}',
        '.at-lb__stage{display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:64px 16px;touch-action:pan-y}',
        '.at-lb__img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;user-select:none;-webkit-user-drag:none}',
        '.at-lb__btn{position:absolute;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:#fff;color:#0c1233;font-size:26px;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3)}',
        '.at-lb__btn:focus-visible{outline:2px solid #fbb400;outline-offset:2px}',
        '.at-lb__close{top:16px;right:16px}',
        '.at-lb__prev{left:16px;top:50%;transform:translateY(-50%)}',
        '.at-lb__next{right:16px;top:50%;transform:translateY(-50%)}',
        '.at-lb__count{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);padding:6px 14px;border-radius:40px;background:#fff;color:#0c1233;font-size:14px}',
        '@media (max-width:49.99em){.at-lb__prev,.at-lb__next{display:none}}',
        '.at-toast{position:fixed;left:50%;bottom:96px;z-index:1100;transform:translate(-50%,12px);padding:10px 18px;border-radius:40px;background:#0c1233;color:#fff;font-size:14px;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}',
        '.at-toast.is-on{opacity:1;transform:translate(-50%,0)}',
        '.sc-17hm49n-8{cursor:pointer}'
    ].join('');
    document.head.appendChild(style);

    var toastEl, toastTimer;
    function toast(msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'at-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        toastEl.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
    }

    /* ----------------------------------------------------------------------
       1. Mobile menu
       ---------------------------------------------------------------------- */
    (function menu() {
        var btn = $('[data-testid="show-menu-mobile"]');
        var drawer = $('.Tz72Ma__drawer');
        var bars = $('.Tz72Ma__menuButtonInner');
        if (!btn || !drawer) return;

        var wide = window.matchMedia('(min-width: 50em)');
        var isOpen = false;
        if (!drawer.id) drawer.id = btn.getAttribute('aria-controls') || 'atc-navigation';

        function set(open) {
            isOpen = open;
            drawer.classList.toggle('Tz72Ma__drawerActive', open);
            if (bars) bars.classList.toggle('Tz72Ma__menuButtonInnerActive', open);
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Hide mobile menu' : 'Show mobile menu');
            document.body.style.overflow = open ? 'hidden' : '';
            if (open) window.scrollTo(0, 0);
            syncInert();
        }

        function syncInert() {
            // keep the off-screen drawer out of the tab order while closed
            drawer.inert = !wide.matches && !isOpen;
        }

        btn.addEventListener('click', function () { set(!isOpen); });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) { set(false); btn.focus(); }
        });

        drawer.addEventListener('click', function (e) {
            if (e.target.closest('a')) set(false);
        });

        var onChange = function () { if (wide.matches) set(false); syncInert(); };
        if (wide.addEventListener) wide.addEventListener('change', onChange);
        else wide.addListener(onChange);

        syncInert();
    })();

    /* ----------------------------------------------------------------------
       2. Gallery carousel
       ---------------------------------------------------------------------- */
    var gallery = (function () {
        var track = $('.sc-17hm49n-1');
        if (!track) return null;

        var items = $$('.sc-17hm49n-2', track);
        var next = $('.sc-17hm49n-3');
        var dots = $$('.sc-17hm49n-8');
        var counterNum = $('.sc-17hm49n-10');
        var current = 0;

        // hide dots that have no matching photo
        dots.forEach(function (d, i) { if (i >= items.length) d.style.display = 'none'; });

        function leftOf(i) { return items[i].offsetLeft - track.offsetLeft; }

        function goTo(i) {
            i = Math.max(0, Math.min(items.length - 1, i));
            track.scrollTo({ left: leftOf(i), behavior: smooth });
        }

        function indexFromScroll() {
            var best = 0, bestDist = Infinity;
            items.forEach(function (_, i) {
                var d = Math.abs(leftOf(i) - track.scrollLeft);
                if (d < bestDist) { bestDist = d; best = i; }
            });
            return best;
        }

        function render(i) {
            current = i;
            dots.forEach(function (d, n) {
                d.classList.toggle('gqKoiz', n === i);
                d.classList.toggle('cQMFFj', n !== i);
            });
            if (counterNum) counterNum.textContent = (i + 1) + '/';
        }

        var ticking = false;
        track.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () { render(indexFromScroll()); ticking = false; });
        }, { passive: true });

        if (next) {
            next.addEventListener('click', function () {
                var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
                if (atEnd) track.scrollTo({ left: 0, behavior: smooth });
                else track.scrollBy({ left: Math.round(track.clientWidth * 0.55), behavior: smooth });
            });
        }

        dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });

        render(indexFromScroll());
        return { items: items, goTo: goTo, current: function () { return current; } };
    })();

    /* ----------------------------------------------------------------------
       3. Lightbox
       ---------------------------------------------------------------------- */
    (function lightbox() {
        if (!gallery) return;

        var photos = gallery.items.map(function (item) {
            var img = $('img', item);
            if (!img) return null;
            var src = img.currentSrc || img.src;
            return { thumb: src, big: src.replace(/\/w\d+\//, '/w1200/'), alt: img.alt || 'Vehicle image' };
        }).filter(Boolean);
        if (!photos.length) return;

        var box = document.createElement('div');
        box.className = 'at-lb';
        box.hidden = true;
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Photo gallery');
        box.innerHTML =
            '<button type="button" class="at-lb__btn at-lb__close" aria-label="Close gallery">&times;</button>' +
            '<button type="button" class="at-lb__btn at-lb__prev" aria-label="Previous image">&#8249;</button>' +
            '<div class="at-lb__stage"><img class="at-lb__img" alt=""></div>' +
            '<button type="button" class="at-lb__btn at-lb__next" aria-label="Next image">&#8250;</button>' +
            '<div class="at-lb__count" aria-live="polite"></div>';
        document.body.appendChild(box);

        var img = $('.at-lb__img', box);
        var count = $('.at-lb__count', box);
        var closeBtn = $('.at-lb__close', box);
        var index = 0, lastFocus = null;

        function show(i) {
            index = (i + photos.length) % photos.length;
            var p = photos[index];
            img.onerror = function () { img.onerror = null; img.src = p.thumb; };
            img.src = p.big;
            img.alt = p.alt + ' ' + (index + 1) + ' of ' + photos.length;
            count.textContent = (index + 1) + ' / ' + photos.length;
        }

        function open(i) {
            lastFocus = document.activeElement;
            show(i);
            box.hidden = false;
            document.body.style.overflow = 'hidden';
            closeBtn.focus();
        }

        function close() {
            box.hidden = true;
            document.body.style.overflow = '';
            gallery.goTo(index);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        $('.at-lb__prev', box).addEventListener('click', function () { show(index - 1); });
        $('.at-lb__next', box).addEventListener('click', function () { show(index + 1); });
        closeBtn.addEventListener('click', close);

        box.addEventListener('click', function (e) {
            if (e.target === box || e.target.classList.contains('at-lb__stage')) close();
        });

        document.addEventListener('keydown', function (e) {
            if (box.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') show(index - 1);
            else if (e.key === 'ArrowRight') show(index + 1);
            else if (e.key === 'Tab') {                 // keep focus inside the dialog
                var f = $$('button', box).filter(function (b) { return b.offsetParent !== null; });
                if (!f.length) return;
                var first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });

        // swipe left / right on touch screens
        var startX = null;
        box.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
        box.addEventListener('touchend', function (e) {
            if (startX === null) return;
            var dx = e.changedTouches[0].clientX - startX;
            startX = null;
            if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
        }, { passive: true });

        // openers: a photo, the "Gallery" pill, or the photo counter
        gallery.items.forEach(function (item, i) {
            var b = $('button', item);
            if (b) b.addEventListener('click', function () { open(i); });
        });
        $$('.sc-krh3vz-1, .sc-17hm49n-9').forEach(function (b) {
            b.addEventListener('click', function () { open(gallery.current()); });
        });
    })();

    /* ----------------------------------------------------------------------
       4. Section nav (Key information · Pricing · Overview · ...)
       ---------------------------------------------------------------------- */
    (function sectionNav() {
        var nav = $('.sc-pamipx-0');
        if (!nav) return;

        var map = [
            ['vehicle-information-nav', 'vehicle-information'],
            ['pricing-nav', 'pricing'],
            ['overview-nav', 'overview'],
            ['description-nav', 'description'],
            ['meet-seller-nav', 'meet-seller']
        ].map(function (pair) {
            return { btn: document.getElementById(pair[0]), sec: document.getElementById(pair[1]) };
        }).filter(function (m) { return m.btn && m.sec; });

        var row = $('.sc-pamipx-1', nav);
        var SHOW_AFTER = 420;      // px scrolled before the bar appears
        var visible = null;

        // take over from the CSS-only reveal so it works in every browser
        nav.style.animation = 'none';
        nav.style.transition = 'opacity .2s ease, transform .2s ease, visibility .2s';

        function setVisible(v) {
            if (v === visible) return;
            visible = v;
            nav.style.opacity = v ? '1' : '0';
            nav.style.visibility = v ? 'visible' : 'hidden';
            nav.style.transform = v ? 'none' : 'translateY(-100%)';
            nav.inert = !v;
        }

        function setActive(i) {
            map.forEach(function (m, n) {
                var on = n === i;
                m.btn.classList.toggle('gLInlC', on);
                m.btn.classList.toggle('leRIdN', !on);
                if (on) m.btn.setAttribute('aria-current', 'true');
                else m.btn.removeAttribute('aria-current');
            });
            var b = map[i] && map[i].btn;
            if (b && row && row.scrollWidth > row.clientWidth) {   // keep it in view on phones
                row.scrollTo({ left: b.offsetLeft - row.clientWidth / 2 + b.offsetWidth / 2, behavior: smooth });
            }
        }

        var lastActive = -1, ticking = false;
        function update() {
            ticking = false;
            setVisible(window.scrollY > SHOW_AFTER);

            var line = nav.offsetHeight + 32, active = 0;
            map.forEach(function (m, n) {
                if (m.sec.getBoundingClientRect().top <= line) active = n;
            });
            if (active !== lastActive) { lastActive = active; setActive(active); }
        }

        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        window.addEventListener('resize', update);

        map.forEach(function (m) {
            m.btn.addEventListener('click', function () {
                m.sec.scrollIntoView({ behavior: smooth, block: 'start' });   // html scroll-padding-top clears the bar
            });
        });

        update();
    })();

    /* ----------------------------------------------------------------------
       5. Back to top
       ---------------------------------------------------------------------- */
    $$('.sc-pamipx-5, .JVyAIW__root').forEach(function (b) {
        b.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: smooth });
            var skip = $('#top, #content');
            if (skip && skip.focus) { skip.setAttribute('tabindex', '-1'); skip.focus({ preventScroll: true }); }
        });
    });

    /* ----------------------------------------------------------------------
       6. Save (heart) buttons — all copies stay in sync, remembered locally
       ---------------------------------------------------------------------- */
    (function save() {
        var buttons = $$('[data-testid="save-advert-button"], .save-advert-button');
        if (!buttons.length) return;

        var key = 'at-saved:' + location.pathname;
        var saved = false;
        try { saved = localStorage.getItem(key) === '1'; } catch (e) { /* storage unavailable */ }

        function paint() {
            buttons.forEach(function (b) {
                var path = $('svg path', b);
                if (path) {
                    if (!path.dataset.outline) path.dataset.outline = path.getAttribute('d');
                    // outline heart ↔ solid heart (first sub-path is the outer shape)
                    path.setAttribute('d', saved ? path.dataset.outline.split('ZM')[0] + 'Z' : path.dataset.outline);
                }
                b.classList.toggle('is-saved', saved);
                b.setAttribute('aria-pressed', String(saved));
                b.setAttribute('aria-label', saved ? 'Remove from saved adverts' : 'Save advert');
            });
        }

        buttons.forEach(function (b) {
            b.addEventListener('click', function () {
                saved = !saved;
                try { localStorage.setItem(key, saved ? '1' : '0'); } catch (e) { /* ignore */ }
                paint();
                toast(saved ? 'Advert saved' : 'Removed from saved');
            });
        });

        paint();
    })();

    /* ----------------------------------------------------------------------
       7. Share
       ---------------------------------------------------------------------- */
    (function share() {
        var btn = $('[data-testid="share-advert-button"]');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var data = { title: document.title, url: location.href };
            if (navigator.share) {
                navigator.share(data).catch(function () { /* cancelled */ });
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(data.url).then(
                    function () { toast('Link copied'); },
                    function () { window.prompt('Copy this link', data.url); }
                );
            } else {
                window.prompt('Copy this link', data.url);
            }
        });
    })();

    /* ----------------------------------------------------------------------
       8. Read full description (expand / collapse the clamped text)
       ---------------------------------------------------------------------- */
    (function description() {
        var text = $('.VVuNUW__descriptionText');
        var btn = $('[data-testid="description-signpost"]');
        if (!text || !btn) return;

        var label = $('._2Ga58G__text', btn);
        var original = label ? label.textContent : '';
        var open = false;
        btn.setAttribute('aria-expanded', 'false');

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            open = !open;
            text.style.display = open ? 'block' : '';
            text.style.webkitLineClamp = open ? 'unset' : '';
            text.style.lineClamp = open ? 'unset' : '';
            text.style.overflow = open ? 'visible' : '';
            if (label) label.textContent = open ? 'Show less' : original;
            btn.setAttribute('aria-expanded', String(open));
        });
    })();
})();