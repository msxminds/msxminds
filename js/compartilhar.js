/* ============================================================
   MSX MINDS — COMPARTILHAMENTO DOS CONTEÚDOS DO BLOG
   Adiciona um link de compartilhamento no WhatsApp em cada card
   ============================================================ */

(function () {
    'use strict';

    var cards = document.querySelectorAll('.grid-blog .card-3d');
    if (!cards.length) return;

    var pageUrl = window.location.href.split('#')[0].split('?')[0];

    cards.forEach(function (card) {
        var titleEl = card.querySelector('h3');
        var body = card.querySelector('.card-body');
        if (!titleEl || !body) return;

        var title = titleEl.innerText.replace(/\s+/g, ' ').trim();
        if (!title) return;

        var modalBtn = card.querySelector('[data-modal]');
        var hash = modalBtn ? '#' + modalBtn.getAttribute('data-modal') : '';
        var shareUrl = pageUrl + '?utm_source=whatsapp&utm_medium=share&utm_campaign=blog-conteudo' + hash;

        var link = document.createElement('a');
        link.className = 'card-share';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.href = 'https://wa.me/?text=' + encodeURIComponent(title + '\n\n' + shareUrl);
        link.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Compartilhar no WhatsApp';
        link.addEventListener('click', function () {
            if (window.MSXTrack && window.MSXTrack.event) {
                window.MSXTrack.event('share_click', { network: 'whatsapp', content: 'blog-card' });
            }
        });
        body.appendChild(link);
    });

    /* Abre o artigo em modal quando o link compartilhado traz o hash. */
    function abrirModalDoHash() {
        var id = (window.location.hash || '').replace(/^#/, '');
        if (!id || id.indexOf('modal-') !== 0) return;
        var trigger = document.querySelector('[data-modal="' + id + '"]');
        if (trigger) {
            window.setTimeout(function () { trigger.click(); }, 250);
        }
    }

    document.addEventListener('DOMContentLoaded', abrirModalDoHash);
})();
