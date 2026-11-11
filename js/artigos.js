/* ============================================================
   MSX MINDS — ARTIGOS
   Menu, progresso de leitura, compartilhamento e copiar link
   ============================================================ */

(function () {
    'use strict';

    var header = document.querySelector('.ar-header');
    var progress = document.querySelector('.ar-progress');
    var toggle = document.querySelector('.ar-menu-toggle');
    var nav = document.querySelector('.ar-nav');

    /* ---------------- MENU MOBILE ---------------- */
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ---------------- PROGRESSO DE LEITURA ---------------- */
    function updateProgress() {
        if (!progress) return;
        var doc = document.documentElement;
        var total = doc.scrollHeight - window.innerHeight;
        var pct = total > 0 ? (window.scrollY / total) * 100 : 0;
        progress.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    /* ---------------- COMPARTILHAMENTO ---------------- */
    function canonicalUrl() {
        var link = document.querySelector('link[rel="canonical"]');
        return link ? link.href : window.location.href.split('#')[0].split('?')[0];
    }

    function withUtm(url, source) {
        var slug = window.location.pathname.split('/').pop().replace(/\.html?$/, '') || 'artigo';
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        return url + sep +
            'utm_source=' + encodeURIComponent(source) +
            '&utm_medium=share' +
            '&utm_campaign=' + encodeURIComponent('artigo-' + slug);
    }

    function pageTitle() {
        var h1 = document.querySelector('.ar-main h1, .ar-hub-hero h1');
        return h1 ? h1.innerText.trim() : document.title;
    }

    var url = canonicalUrl();
    var title = pageTitle();

    document.querySelectorAll('[data-share]').forEach(function (el) {
        var network = el.getAttribute('data-share');
        if (network === 'whatsapp') {
            el.setAttribute('href', 'https://wa.me/?text=' + encodeURIComponent(title + '\n\n' + withUtm(url, 'whatsapp')));
        } else if (network === 'linkedin') {
            el.setAttribute('href', 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(withUtm(url, 'linkedin')));
        }
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        el.addEventListener('click', function () {
            if (window.MSXTrack && window.MSXTrack.event) {
                window.MSXTrack.event('share_click', { network: network });
            }
        });
    });

    /* ---------------- COPIAR LINK ---------------- */
    document.querySelectorAll('[data-copy-link]').forEach(function (button) {
        button.addEventListener('click', function () {
            var original = button.getAttribute('data-label') || button.innerText;
            button.setAttribute('data-label', original);

            function done() {
                button.innerText = 'Link copiado!';
                if (window.MSXTrack && window.MSXTrack.event) {
                    window.MSXTrack.event('share_click', { network: 'copy' });
                }
                setTimeout(function () { button.innerText = original; }, 2200);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(done).catch(fallback);
            } else {
                fallback();
            }

            function fallback() {
                var area = document.createElement('textarea');
                area.value = url;
                area.setAttribute('readonly', '');
                area.style.position = 'absolute';
                area.style.left = '-9999px';
                document.body.appendChild(area);
                area.select();
                try { document.execCommand('copy'); done(); } catch (e) { button.innerText = 'Não foi possível copiar'; }
                document.body.removeChild(area);
            }
        });
    });

    /* ---------------- LINK ATIVO NO MENU ---------------- */
    var currentPath = window.location.pathname.replace(/\/$/, '/index.html');
    document.querySelectorAll('.ar-nav a').forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        try {
            var target = new URL(href, window.location.href);
            if (target.pathname.replace(/\/$/, '/index.html') === currentPath) {
                link.classList.add('active');
            }
        } catch (e) { /* ignorar URLs inválidas */ }
    });

    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });
    }
})();
