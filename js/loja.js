/* ============================================================
   MSX MINDS — LOJA
   Adiciona CTA de orçamento contextual em cada produto.
   O clique é rastreado automaticamente pelo tracking.js.
   ============================================================ */

(function () {
    'use strict';

    var WHATSAPP = '5543996680049';

    function limpar(texto) {
        return String(texto || '').replace(/\s+/g, ' ').trim();
    }

    function initProductCtas() {
        document.querySelectorAll('.category-section .card-3d').forEach(function (card) {
            if (card.dataset.ctaReady === 'true') return;

            var body = card.querySelector('.card-body');
            var titleEl = card.querySelector('.card-body h3');
            var codeEl = card.querySelector('.card-image-overlay');
            if (!body || !titleEl || !codeEl) return;

            var title = limpar(titleEl.textContent);
            var code = limpar(codeEl.textContent);
            if (!title || !code) return;

            var category = card.closest('.category-section');
            var categoryTitle = category ? category.querySelector('.category-title') : null;
            var categoryName = categoryTitle ? limpar(categoryTitle.textContent).replace(/\(\d+ itens\)/i, '').trim() : 'Produto';

            var message = 'Olá, MSX Minds! Quero um orçamento para o produto *' + code + ' - ' + title + '*.';
            var link = document.createElement('a');
            link.className = 'product-cta';
            link.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('data-cta', 'product-whatsapp');
            link.setAttribute('data-offer', categoryName);
            link.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Solicitar orçamento';

            body.appendChild(link);
            card.dataset.ctaReady = 'true';
        });
    }

    document.addEventListener('DOMContentLoaded', initProductCtas);
})();
