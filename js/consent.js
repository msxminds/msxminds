/* ============================================================
   MSX MINDS — CONSENTIMENTO DE COOKIES (LGPD)
   ------------------------------------------------------------
   Nenhum script de medição (GA4, Google Ads ou Meta Pixel) é
   carregado antes do consentimento. A escolha fica salva em
   localStorage e pode ser alterada na Política de Privacidade.
   ============================================================ */

(function () {
    'use strict';

    var KEY = 'msx_consent_v1';
    var valor = null;

    try {
        valor = localStorage.getItem(KEY);
    } catch (e) {
        valor = null;
    }

    if (valor !== 'granted' && valor !== 'denied') valor = null;

    window.MSX_CONSENT = valor;

    var banner = null;
    var baseUrl = '/';

    try {
        var script = document.currentScript;
        if (script && script.src) {
            baseUrl = new URL(script.src).pathname.replace(/\/js\/consent\.js$/, '/');
        }
    } catch (e) {
        baseUrl = '/';
    }

    function privacyUrl() {
        return baseUrl + 'politica-de-privacidade.html';
    }

    function hide() {
        if (!banner) return;
        banner.classList.remove('is-open');
        window.setTimeout(function () {
            if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
            banner = null;
        }, 280);
    }

    function apply(choice) {
        valor = choice === 'granted' ? 'granted' : 'denied';
        window.MSX_CONSENT = valor;

        try {
            localStorage.setItem(KEY, valor);
        } catch (e) { /* modo privado */ }

        if (window.MSXTrack && window.MSXTrack.setConsent) {
            window.MSXTrack.setConsent(valor === 'granted');
        }

        document.dispatchEvent(new CustomEvent('msx:consent', {
            detail: { consent: valor }
        }));

        hide();
    }

    function createBanner() {
        if (banner || !document.body) return;

        banner = document.createElement('div');
        banner.className = 'msx-consent';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', 'Preferências de cookies');

        banner.innerHTML = [
            '<div class="msx-consent-card">',
            '  <div class="msx-consent-text">',
            '    <strong><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Privacidade e cookies</strong>',
            '    <p>Usamos cookies e tecnologias semelhantes para medir o desempenho do site e melhorar sua experiência. Nada é ativado antes do seu consentimento. Saiba mais na <a href="' + privacyUrl() + '">Política de Privacidade</a>.</p>',
            '  </div>',
            '  <div class="msx-consent-actions">',
            '    <button type="button" class="msx-consent-btn is-ghost" data-consent="denied">Recusar</button>',
            '    <button type="button" class="msx-consent-btn" data-consent="granted">Aceitar</button>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(banner);

        banner.querySelectorAll('[data-consent]').forEach(function (button) {
            button.addEventListener('click', function () {
                apply(button.getAttribute('data-consent'));
            });
        });

        window.requestAnimationFrame(function () {
            if (banner) banner.classList.add('is-open');
        });
    }

    function maybeShow() {
        if (valor) return;
        if (!window.MSX_ANALYTICS_CONFIGURED) return;
        createBanner();
    }

    document.addEventListener('msx:tracking-ready', maybeShow);

    window.addEventListener('DOMContentLoaded', function () {
        /* Fallback para o caso de o tracking já ter sido executado. */
        window.setTimeout(maybeShow, 0);
    });

    window.MSXConsent = {
        open: createBanner,
        close: hide,
        get: function () { return valor; },
        set: apply
    };
})();
