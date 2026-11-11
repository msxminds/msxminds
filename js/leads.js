/* ============================================================
   MSX MINDS — CAPTURA DE LEADS DAS LANDING PAGES
   Valida o formulário, registra o lead, dispara o evento de
   conversão e abre o WhatsApp com a mensagem de qualificação
   já preenchida (com código de referência para etiquetas).
   ============================================================ */

(function () {
    'use strict';

    function onlyDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function formatPhone(value) {
        var digits = onlyDigits(value).slice(0, 11);
        if (digits.length <= 2) return digits.length ? '(' + digits : '';
        if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
        if (digits.length <= 10) {
            return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
        }
        return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
    }

    function validPhone(value) {
        var digits = onlyDigits(value);
        if (digits.indexOf('55') === 0 && digits.length > 11) digits = digits.slice(2);
        return digits.length === 10 || digits.length === 11;
    }

    function setError(field, message) {
        if (!field) return;
        field.classList.add('has-error');
        var error = field.querySelector('.lp-error');
        if (error) error.textContent = message;
        var input = field.querySelector('input, select, textarea');
        if (input) input.setAttribute('aria-invalid', 'true');
    }

    function clearError(field) {
        if (!field) return;
        field.classList.remove('has-error');
        var input = field.querySelector('input, select, textarea');
        if (input) input.removeAttribute('aria-invalid');
    }

    function buildMessage(form, lead) {
        var offer = form.getAttribute('data-offer') || 'Diagnóstico de oportunidades';
        var segment = form.getAttribute('data-segment') || '';
        var prefix = form.getAttribute('data-prefix') || 'SITE';
        var utm = (window.MSXTrack && window.MSXTrack.utm) || {};

        var origin = prefix;
        if (utm.source && utm.source !== 'direto') origin += ' · ' + utm.source;
        if (utm.medium) origin += '/' + utm.medium;
        if (utm.campaign) origin += ' · ' + utm.campaign;

        return [
            'Olá, MSX Minds! Vim pelo site e quero solicitar o *' + offer + '*.',
            '',
            '*Referência:* ' + lead.id,
            '*Oferta:* ' + offer + (segment ? ' (' + segment + ')' : ''),
            '*Nome:* ' + lead.name,
            '*WhatsApp:* ' + lead.phone,
            '*Cidade/região:* ' + lead.city,
            '*Principal desafio:* ' + lead.challenge,
            '*Já possui sistema/equipamento:* ' + lead.has_system,
            '*Origem:* ' + origin,
            '',
            'Pode me explicar como funciona o diagnóstico gratuito?'
        ].join('\n');
    }

    function initForm(form) {
        if (form.dataset.msxReady === 'true') return;
        form.dataset.msxReady = 'true';
        form.setAttribute('novalidate', 'novalidate');

        var phone = form.querySelector('input[name="phone"]');
        if (phone) {
            phone.addEventListener('input', function () {
                phone.value = formatPhone(phone.value);
            });
        }

        form.querySelectorAll('input, select, textarea').forEach(function (input) {
            input.addEventListener('input', function () {
                clearError(input.closest('.lp-field'));
            });
            input.addEventListener('change', function () {
                clearError(input.closest('.lp-field'));
            });
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (form.dataset.submitted === 'true') return;

            // Honeypot: robôs preenchem este campo invisível
            var honeypot = form.querySelector('input[name="website"]');
            if (honeypot && honeypot.value) {
                showSuccess(form, null, null);
                return;
            }

            var nameField = form.querySelector('input[name="name"]');
            var phoneField = form.querySelector('input[name="phone"]');
            var cityField = form.querySelector('input[name="city"]');
            var challengeField = form.querySelector('[name="challenge"]');
            var systemField = form.querySelector('[name="has_system"]');
            var consentField = form.querySelector('input[name="consent"]');
            var valid = true;

            if (!nameField || nameField.value.trim().length < 2) {
                setError(nameField && nameField.closest('.lp-field'), 'Informe seu nome.');
                valid = false;
            }
            if (!phoneField || !validPhone(phoneField.value)) {
                setError(phoneField && phoneField.closest('.lp-field'), 'Informe um WhatsApp válido com DDD.');
                valid = false;
            }
            if (!cityField || cityField.value.trim().length < 2) {
                setError(cityField && cityField.closest('.lp-field'), 'Informe sua cidade ou região.');
                valid = false;
            }
            if (!challengeField || !challengeField.value) {
                setError(challengeField && challengeField.closest('.lp-field'), 'Selecione o principal desafio.');
                valid = false;
            }
            if (!consentField || !consentField.checked) {
                setError(consentField && consentField.closest('.lp-field'), 'Precisamos da sua autorização para contato.');
                valid = false;
            }

            if (!valid) {
                var firstError = form.querySelector('.has-error input, .has-error select');
                if (firstError) firstError.focus();
                return;
            }

            var lead = {
                name: nameField.value.trim(),
                phone: formatPhone(phoneField.value),
                city: cityField.value.trim(),
                challenge: challengeField.value,
                has_system: systemField ? systemField.value : '',
                segment: form.getAttribute('data-segment') || '',
                offer: form.getAttribute('data-offer') || ''
            };

            var message = buildMessage(form, lead);
            var waUrl = 'https://wa.me/5543996680049?text=' + encodeURIComponent(message);

            if (window.MSXTrack) {
                waUrl = window.MSXTrack.whatsappLink(message);
                lead.page = window.location.pathname.split('/').pop() || 'index.html';
                lead.offer = form.getAttribute('data-offer') || '';
                var saved = window.MSXTrack.addLead(lead);
                lead.id = saved.id;

                // A mensagem de referência precisa do ID gerado pelo armazenamento
                message = buildMessage(form, lead);
                waUrl = window.MSXTrack.whatsappLink(message);

                window.MSXTrack.event('generate_lead', {
                    lead_id: lead.id,
                    offer: lead.offer,
                    segment: lead.segment,
                    city: lead.city,
                    challenge: lead.challenge,
                    form_id: form.id || 'lp-form'
                });

                if (window.MSXTrack.config.googleAds && window.MSXTrack.config.googleAdsLeadLabel && window.gtag) {
                    window.gtag('event', 'conversion', {
                        send_to: window.MSXTrack.config.googleAds + '/' + window.MSXTrack.config.googleAdsLeadLabel,
                        value: 1.0,
                        currency: 'BRL'
                    });
                }
            } else {
                lead.id = 'MSX-' + Date.now().toString(36).toUpperCase();
                message = buildMessage(form, lead);
                waUrl = 'https://wa.me/5543996680049?text=' + encodeURIComponent(message);
            }

            form.dataset.submitted = 'true';
            var win = window.open(waUrl, '_blank');
            showSuccess(form, lead, waUrl);
            if (!win) {
                // Pop-up bloqueado: o botão da tela de sucesso abre o WhatsApp
                var fallback = document.querySelector('.lp-form-success a.lp-btn');
                if (fallback) {
                    fallback.setAttribute('href', waUrl);
                    fallback.classList.add('pulse-attention');
                }
            }
        });
    }

    function showSuccess(form, lead, waUrl) {
        var card = form.closest('.lp-form-card');
        if (!card) return;
        var success = card.querySelector('.lp-form-success');
        if (!success) return;

        if (lead && lead.name) {
            var nameTarget = success.querySelector('[data-lead-name]');
            if (nameTarget) nameTarget.textContent = lead.name.split(' ')[0];
            var refTarget = success.querySelector('[data-lead-ref]');
            if (refTarget) refTarget.textContent = lead.id;
        }
        if (waUrl) {
            var link = success.querySelector('a.lp-btn');
            if (link) link.setAttribute('href', waUrl);
        }

        form.style.display = 'none';
        var head = card.querySelector('.lp-form-head');
        if (head) head.style.display = 'none';
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('form.lp-form').forEach(initForm);
    });

    // Máscara também para campos de telefone fora dos formulários de lead
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('input[type="tel"][data-mask="phone"]').forEach(function (input) {
            input.addEventListener('input', function () {
                input.value = formatPhone(input.value);
            });
        });
    });
})();
