/* ============================================================
   MSX MINDS — Comportamentos das landing pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('lpMenuToggle');
    var nav = document.getElementById('lpNav');

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.innerHTML = open
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });

        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }

    // Destaque do item ativo no menu
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.lp-nav a').forEach(function (link) {
        var href = (link.getAttribute('href') || '').split('#')[0];
        if (href === current) link.classList.add('active');
    });

    // Pré-seleciona o desafio quando a página é aberta com ?desafio=...
    // Aceita o texto completo ou uma palavra-chave (ex.: ?desafio=irrigacao).
    var normalize = function (text) {
        return (text || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    };
    var params = new URLSearchParams(window.location.search);
    var desafio = params.get('desafio');
    if (desafio) {
        var select = document.querySelector('form.lp-form select[name="challenge"]');
        if (select) {
            var alvo = normalize(desafio);
            Array.prototype.forEach.call(select.options, function (option) {
                var valor = normalize(option.value);
                if (!valor) return;
                if (valor === alvo || valor.indexOf(alvo) !== -1 || alvo.indexOf(valor) !== -1) {
                    select.value = option.value;
                }
            });
        }
    }
});
