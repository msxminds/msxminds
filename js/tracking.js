/* ============================================================
   MSX MINDS — TRACKING, ATRIBUIÇÃO E BASE DE LEADS
   ------------------------------------------------------------
   Como ativar:
   1. Preencha os IDs abaixo (ou defina window.MSX_TRACKING_CONFIG
      antes de carregar este arquivo).
   2. GA4:     "G-XXXXXXXXXX"
      Meta:    "123456789012345"  (Pixel)
      Ads:     "AW-XXXXXXXXX"     (Google Ads)
   3. O webhook é opcional: envie leads para n8n, Make ou Google
      Sheets (Apps Script) para centralizar os contatos.
   Enquanto os IDs estiverem vazios, nenhum script externo é
   carregado — o site funciona normalmente e os eventos ficam
   disponíveis no dataLayer e no painel local.
   ============================================================ */

(function () {
    'use strict';

    var CONFIG_PADRAO = {
        ga4: '',                 // Ex.: 'G-XXXXXXXXXX'
        metaPixel: '',           // Ex.: '123456789012345'
        googleAds: '',           // Ex.: 'AW-XXXXXXXXX'
        googleAdsLeadLabel: '',  // Ex.: 'AbC-D_efG'
        whatsapp: '5543996680049',
        leadWebhook: '',         // Ex.: 'https://script.google.com/.../exec'
        debug: false
    };

    var cfg = Object.assign({}, CONFIG_PADRAO, window.MSX_TRACKING_CONFIG || {});

    /* ---------------- CONSENTIMENTO (LGPD) ---------------- */
    var CONSENT_KEY = 'msx_consent_v1';
    var consentimento = window.MSX_CONSENT || null;

    if (consentimento !== 'granted' && consentimento !== 'denied') {
        try {
            consentimento = localStorage.getItem(CONSENT_KEY);
        } catch (e) {
            consentimento = null;
        }
    }
    if (consentimento !== 'granted' && consentimento !== 'denied') {
        consentimento = null;
    }
    window.MSX_CONSENT = consentimento;
    window.MSX_ANALYTICS_CONFIGURED = Boolean(
        cfg.ga4 || cfg.metaPixel || cfg.googleAds || cfg.googleAdsLeadLabel
    );

    function hasConsent() {
        return consentimento === 'granted';
    }

    var KEYS = {
        leads: 'msx_leads_v1',
        utm: 'msx_utm_v1',
        firstTouch: 'msx_first_touch_v1',
        session: 'msx_session_v1'
    };

    var STATUS = ['novo', 'qualificado', 'diagnostico', 'proposta', 'negociacao', 'fechado', 'posvenda', 'perdido'];

    /* ---------------- UTILIDADES ---------------- */
    function safeParse(value, fallback) {
        try {
            var parsed = JSON.parse(value);
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch (e) {
            return fallback;
        }
    }

    function storageGet(store, key, fallback) {
        try {
            return safeParse(store.getItem(key), fallback);
        } catch (e) {
            return fallback;
        }
    }

    function storageSet(store, key, value) {
        try {
            store.setItem(key, JSON.stringify(value));
        } catch (e) {
            /* modo privado / storage cheio */
        }
    }

    function uuid() {
        return 'MSX-' + Date.now().toString(36).toUpperCase() + '-' +
            Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    function pageName() {
        var path = window.location.pathname.split('/').pop();
        return path || 'index.html';
    }

    function onlyDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function classifyReferrer(ref) {
        if (!ref) return 'direto';
        var r = ref.toLowerCase();
        if (r.indexOf('google') > -1) return 'google';
        if (r.indexOf('instagram') > -1) return 'instagram';
        if (r.indexOf('facebook') > -1 || r.indexOf('fb.') > -1) return 'facebook';
        if (r.indexOf('linkedin') > -1) return 'linkedin';
        if (r.indexOf('tiktok') > -1) return 'tiktok';
        if (r.indexOf('youtube') > -1) return 'youtube';
        if (r.indexOf('bing') > -1) return 'bing';
        return 'referral';
    }

    /* ---------------- ATRIBUIÇÃO (UTM / CLICK IDs) ---------------- */
    var params = new URLSearchParams(window.location.search);

    function pickParam(name) {
        var value = params.get(name);
        return value ? value.trim() : '';
    }

    var utmAtual = {
        source: pickParam('utm_source') || classifyReferrer(document.referrer),
        medium: pickParam('utm_medium') || (document.referrer ? 'referral' : 'organic'),
        campaign: pickParam('utm_campaign'),
        term: pickParam('utm_term'),
        content: pickParam('utm_content'),
        gclid: pickParam('gclid'),
        fbclid: pickParam('fbclid'),
        landing_page: pageName(),
        referrer: document.referrer || '',
        captured_at: new Date().toISOString()
    };

    // Mantém a atribuição durante a navegação entre páginas
    var utmSalvo = storageGet(sessionStorage, KEYS.utm, null);
    if (!utmSalvo || utmAtual.gclid || utmAtual.fbclid || params.get('utm_source')) {
        storageSet(sessionStorage, KEYS.utm, utmAtual);
    } else {
        utmAtual = utmSalvo;
    }

    if (!storageGet(localStorage, KEYS.firstTouch, null)) {
        storageSet(localStorage, KEYS.firstTouch, utmAtual);
    }

    var sessao = storageGet(sessionStorage, KEYS.session, null);
    if (!sessao) {
        sessao = {
            id: 'SES-' + Date.now().toString(36).toUpperCase(),
            started_at: new Date().toISOString(),
            landing_page: utmAtual.landing_page
        };
        storageSet(sessionStorage, KEYS.session, sessao);
    }

    /* ---------------- DATA LAYER + GA4 / ADS / META ---------------- */
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        window.dataLayer.push(arguments);
    }

    var ga4Carregado = false;
    var adsCarregado = false;
    var metaCarregado = false;

    function carregarGa4() {
        if (!cfg.ga4 || ga4Carregado || !hasConsent()) return;
        ga4Carregado = true;

        var gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4);
        document.head.appendChild(gaScript);

        window.gtag = window.gtag || gtag;
        gtag('js', new Date());
        /* O page_view é enviado manualmente por event('page_view'),
           evitando a duplicidade causada por send_page_view: true. */
        gtag('config', cfg.ga4, { send_page_view: false });
    }

    function carregarGoogleAds() {
        if (!cfg.googleAds || adsCarregado || !hasConsent()) return;
        adsCarregado = true;

        if (!window.gtag) {
            var adsScript = document.createElement('script');
            adsScript.async = true;
            adsScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.googleAds);
            document.head.appendChild(adsScript);
            window.gtag = window.gtag || gtag;
            gtag('js', new Date());
        }
        gtag('config', cfg.googleAds);
    }

    function carregarMetaPixel() {
        if (!cfg.metaPixel || metaCarregado || !hasConsent()) return;
        metaCarregado = true;

        /* eslint-disable */
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
            n.queue = []; t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', cfg.metaPixel);
        window.fbq('track', 'PageView');
    }

    function carregarAnalytics() {
        if (!hasConsent()) return;
        carregarGa4();
        carregarGoogleAds();
        carregarMetaPixel();
    }

    function setConsent(granted) {
        consentimento = granted ? 'granted' : 'denied';
        window.MSX_CONSENT = consentimento;
        try {
            localStorage.setItem(CONSENT_KEY, consentimento);
        } catch (e) { /* modo privado */ }

        if (granted) {
            carregarAnalytics();
            enviarPageView();
        }

        event('consent_updated', { consent: consentimento });
    }

    carregarAnalytics();

    /* ---------------- EVENTOS ---------------- */
    function event(name, data) {
        if (!hasConsent()) {
            if (cfg.debug && window.console) {
                console.info('[MSX Track] evento ignorado sem consentimento:', name);
            }
            return;
        }

        var payload = Object.assign({
            event: name,
            page: pageName(),
            page_title: document.title,
            session_id: sessao.id,
            utm_source: utmAtual.source,
            utm_medium: utmAtual.medium,
            utm_campaign: utmAtual.campaign
        }, data || {});

        window.dataLayer.push(payload);

        if (window.gtag) {
            window.gtag('event', name, payload);
        }

        if (window.fbq) {
            if (name === 'generate_lead') window.fbq('track', 'Lead', payload);
            else if (name === 'whatsapp_click') window.fbq('track', 'Contact', payload);
            else if (name === 'form_start') window.fbq('trackCustom', 'FormStart', payload);
            else if (name === 'view_offer') window.fbq('trackCustom', 'ViewOffer', payload);
            else if (name !== 'page_view') window.fbq('trackCustom', name, payload);
        }

        if (cfg.debug && window.console) {
            console.info('[MSX Track]', name, payload);
        }
    }

    var pageViewEnviado = false;

    function enviarPageView() {
        if (pageViewEnviado || !hasConsent()) return;
        pageViewEnviado = true;
        event('page_view', {
            page_type: (document.body && document.body.getAttribute('data-page-type')) || 'site',
            offer: (document.body && document.body.getAttribute('data-offer')) || ''
        });
    }

    function whatsappLink(message) {
        return 'https://wa.me/' + onlyDigits(cfg.whatsapp) +
            (message ? '?text=' + encodeURIComponent(message) : '');
    }

    /* ---------------- BASE LOCAL DE LEADS ---------------- */
    function getLeads() {
        var leads = storageGet(localStorage, KEYS.leads, []);
        return Array.isArray(leads) ? leads : [];
    }

    function saveLeads(leads) {
        storageSet(localStorage, KEYS.leads, leads.slice(0, 500));
        window.dispatchEvent(new CustomEvent('msx:leads-updated', { detail: leads }));
        return leads;
    }

    function addLead(input) {
        var leads = getLeads();
        var lead = Object.assign({
            id: uuid(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'novo',
            name: '',
            phone: '',
            city: '',
            segment: '',
            offer: '',
            challenge: '',
            has_system: '',
            notes: '',
            estimated_value: 0
        }, input || {});

        lead.attribution = {
            source: utmAtual.source,
            medium: utmAtual.medium,
            campaign: utmAtual.campaign,
            term: utmAtual.term,
            content: utmAtual.content,
            gclid: utmAtual.gclid,
            fbclid: utmAtual.fbclid,
            landing_page: utmAtual.landing_page,
            referrer: utmAtual.referrer
        };
        lead.page = pageName();
        lead.session_id = sessao.id;

        leads.unshift(lead);
        saveLeads(leads);

        if (cfg.leadWebhook) {
            try {
                /* text/plain é um Content-Type permitido em requisições
                   simples (sem preflight). No Apps Script, leia o corpo com
                   JSON.parse(e.postData.contents). */
                fetch(cfg.leadWebhook, {
                    method: 'POST',
                    mode: 'no-cors',
                    keepalive: true,
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: JSON.stringify(lead)
                }).catch(function () { /* silencioso */ });
            } catch (e) { /* silencioso */ }
        }

        return lead;
    }

    function updateLead(id, patch) {
        var leads = getLeads();
        var index = leads.findIndex(function (lead) { return lead.id === id; });
        if (index === -1) return null;
        leads[index] = Object.assign({}, leads[index], patch, { updated_at: new Date().toISOString() });
        saveLeads(leads);
        return leads[index];
    }

    function removeLead(id) {
        return saveLeads(getLeads().filter(function (lead) { return lead.id !== id; }));
    }

    function clearLeads() {
        return saveLeads([]);
    }

    /* ---------------- CLIQUES EM WHATSAPP ---------------- */
    document.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
        if (!link) return;
        event('whatsapp_click', {
            cta_text: (link.textContent || '').trim().slice(0, 80),
            cta_location: link.getAttribute('data-cta') || link.className || 'link',
            link_url: link.getAttribute('href'),
            offer: link.getAttribute('data-offer') || ''
        });
    }, true);

    /* ---------------- CLIQUES EM TELEFONE / E-MAIL ---------------- */
    document.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('a[href^="tel:"], a[href^="mailto:"]') : null;
        if (!link) return;

        var href = link.getAttribute('href') || '';
        var type = href.indexOf('tel:') === 0 ? 'phone_click' : 'email_click';
        event(type, {
            cta_text: (link.textContent || '').trim().slice(0, 80),
            cta_location: link.getAttribute('data-cta') || link.className || 'link',
            link_url: href,
            offer: link.getAttribute('data-offer') || ''
        });
    }, true);

    /* ---------------- CLIQUES EM CTA INTERNO ---------------- */
    document.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('[data-cta]') : null;
        if (!el || el.tagName === 'A' && (el.getAttribute('href') || '').indexOf('wa.me') > -1) return;
        event('cta_click', {
            cta_text: (el.textContent || '').trim().slice(0, 80),
            cta_location: el.getAttribute('data-cta') || 'cta',
            target: el.getAttribute('href') || ''
        });
    }, true);

    /* ---------------- INÍCIO DE FORMULÁRIO ---------------- */
    var formStarted = false;
    document.addEventListener('focusin', function (e) {
        if (formStarted) return;
        var form = e.target.closest ? e.target.closest('form.lp-form, form[data-msx-form]') : null;
        if (!form) return;
        formStarted = true;
        event('form_start', {
            form_id: form.id || 'form',
            offer: form.getAttribute('data-offer') || ''
        });
    });

    /* ---------------- PROFUNDIDADE DE LEITURA ---------------- */
    var depths = { 50: false, 90: false };
    function checkDepth() {
        var doc = document.documentElement;
        var total = doc.scrollHeight - window.innerHeight;
        if (total <= 0) return;
        var pct = (window.scrollY / total) * 100;
        [50, 90].forEach(function (mark) {
            if (!depths[mark] && pct >= mark) {
                depths[mark] = true;
                event('scroll_depth', { percent: mark });
            }
        });
    }
    window.addEventListener('scroll', checkDepth, { passive: true });

    /* ---------------- API PÚBLICA ---------------- */
    window.MSXTrack = {
        config: cfg,
        event: event,
        whatsappLink: whatsappLink,
        utm: utmAtual,
        session: sessao,
        status: STATUS,
        getLeads: getLeads,
        addLead: addLead,
        updateLead: updateLead,
        removeLead: removeLead,
        clearLeads: clearLeads,
        saveLeads: saveLeads,
        setConsent: setConsent,
        hasConsent: hasConsent
    };

    enviarPageView();

    document.dispatchEvent(new CustomEvent('msx:tracking-ready', {
        detail: {
            configured: window.MSX_ANALYTICS_CONFIGURED,
            consent: consentimento
        }
    }));
})();
