/* ============================================================
   MSX MINDS — Central de Marketing
   Utilidades: copiar textos, checklist persistente e KPIs
   ============================================================ */

(function () {
    'use strict';

    var CHECKS_KEY = 'msx_mkt_checks_v1';
    var CONFIG_KEY = 'msx_mkt_config_v1';

    function safeParse(value, fallback) {
        try { return JSON.parse(value) || fallback; } catch (e) { return fallback; }
    }

    /* ---------------- COPIAR TEXTOS ---------------- */
    function initCopy() {
        document.querySelectorAll('.mk-copy').forEach(function (button) {
            button.addEventListener('click', function () {
                var target = document.getElementById(button.getAttribute('data-copy-target'));
                if (!target) return;

                var clone = target.cloneNode(true);
                var insideButton = clone.querySelector('.mk-copy');
                if (insideButton) insideButton.remove();

                var text = clone.textContent.trim();
                var original = button.textContent;

                function done() {
                    button.textContent = 'Copiado!';
                    setTimeout(function () { button.textContent = original; }, 1600);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
                } else {
                    fallback(text, done);
                }
            });
        });
    }

    function fallback(text, done) {
        var area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* silencioso */ }
        document.body.removeChild(area);
    }

    /* ---------------- CHECKLIST PERSISTENTE ---------------- */
    function initChecks() {
        var boxes = document.querySelectorAll('input[data-check]');
        if (!boxes.length) return;

        var state = safeParse(localStorage.getItem(CHECKS_KEY), {});

        boxes.forEach(function (box) {
            var key = box.getAttribute('data-check');
            box.checked = !!state[key];
            box.closest('.mk-check').classList.toggle('done', box.checked);

            box.addEventListener('change', function () {
                state[key] = box.checked;
                try { localStorage.setItem(CHECKS_KEY, JSON.stringify(state)); } catch (e) { /* silencioso */ }
                box.closest('.mk-check').classList.toggle('done', box.checked);
            });
        });
    }

    /* ---------------- KPIs NA PÁGINA DO PLANO ---------------- */
    function initHomeKpis() {
        var leadEl = document.getElementById('mk-home-leads');
        if (!leadEl || !window.MSXTrack) return;

        var config = safeParse(localStorage.getItem(CONFIG_KEY), { budget: 1800 });

        function formatMoney(value) {
            return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
        }

        function render() {
            var leads = window.MSXTrack.getLeads();
            var qualifiedStatus = ['qualificado', 'diagnostico', 'proposta', 'negociacao', 'fechado', 'posvenda'];
            var qualified = leads.filter(function (lead) {
                return qualifiedStatus.indexOf(lead.status) > -1;
            });
            var meetings = leads.filter(function (lead) {
                return ['diagnostico', 'proposta', 'negociacao', 'fechado', 'posvenda'].indexOf(lead.status) > -1;
            });
            var closed = leads.filter(function (lead) {
                return ['fechado', 'posvenda'].indexOf(lead.status) > -1;
            });
            var budget = Number(config.budget) || 0;

            leadEl.textContent = qualified.length;
            document.getElementById('mk-home-cpl').textContent = leads.length ? formatMoney(budget / leads.length) : '—';
            document.getElementById('mk-home-meetings').textContent = meetings.length;
            document.getElementById('mk-home-closed').textContent = closed.length;
        }

        render();
        window.addEventListener('msx:leads-updated', render);
        window.addEventListener('storage', render);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initCopy();
        initChecks();
        initHomeKpis();
    });
})();
