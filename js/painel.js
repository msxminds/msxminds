/* ============================================================
   MSX MINDS — PAINEL DE MARKETING & CRM LOCAL
   Lê os leads capturados pelo site, calcula funil, CPL, CPA,
   receita e ROI, e permite atualizar as etapas do atendimento.
   ============================================================ */

(function () {
    'use strict';

    var CONFIG_KEY = 'msx_mkt_config_v1';

    var DEFAULTS = {
        budget: 1800,
        google: 900,
        meta: 900,
        ticket: 8000,
        margin: 40
    };

    var STATUS_ORDER = ['novo', 'qualificado', 'diagnostico', 'proposta', 'negociacao', 'fechado', 'posvenda', 'perdido'];

    var STATUS_LABELS = {
        novo: '01 — Novo contato',
        qualificado: '02 — Lead qualificado',
        diagnostico: '03 — Diagnóstico',
        proposta: '04 — Proposta enviada',
        negociacao: '05 — Negociação',
        fechado: '06 — Cliente fechado',
        posvenda: '07 — Pós-venda',
        perdido: 'Perdido'
    };

    var config = loadConfig();

    function safeParse(value, fallback) {
        try {
            var parsed = JSON.parse(value);
            return parsed || fallback;
        } catch (e) {
            return fallback;
        }
    }

    function loadConfig() {
        return Object.assign({}, DEFAULTS, safeParse(localStorage.getItem(CONFIG_KEY), {}));
    }

    function saveConfig() {
        try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch (e) { /* silencioso */ }
    }

    function money(value) {
        return 'R$ ' + Math.round(Number(value) || 0).toLocaleString('pt-BR');
    }

    function pct(value) {
        return (Number(value) || 0).toFixed(1).replace('.', ',') + '%';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function statusIndex(status) {
        return STATUS_ORDER.indexOf(status);
    }

    function isQualified(lead) {
        var index = statusIndex(lead.status);
        return index >= 1 && index <= 6;
    }

    function isMeeting(lead) {
        var index = statusIndex(lead.status);
        return index >= 2 && index <= 6;
    }

    function isProposal(lead) {
        var index = statusIndex(lead.status);
        return index >= 3 && index <= 6;
    }

    function isClosed(lead) {
        return lead.status === 'fechado' || lead.status === 'posvenda';
    }

    function leads() {
        return window.MSXTrack ? window.MSXTrack.getLeads() : [];
    }

    /* ---------------- CONFIGURAÇÃO ---------------- */
    function initConfig() {
        var fields = {
            cfgBudget: 'budget',
            cfgGoogle: 'google',
            cfgMeta: 'meta',
            cfgTicket: 'ticket',
            cfgMargin: 'margin'
        };

        Object.keys(fields).forEach(function (id) {
            var input = document.getElementById(id);
            if (!input) return;
            input.value = config[fields[id]];
            input.addEventListener('change', function () {
                config[fields[id]] = Number(input.value) || 0;
            });
        });

        var save = document.getElementById('saveConfig');
        if (save) {
            save.addEventListener('click', function () {
                Object.keys(fields).forEach(function (id) {
                    var input = document.getElementById(id);
                    if (input) config[fields[id]] = Number(input.value) || 0;
                });
                saveConfig();
                var status = document.getElementById('configStatus');
                if (status) {
                    status.textContent = 'Premissas salvas às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
                renderAll();
            });
        }
    }

    /* ---------------- KPIs E FUNIL ---------------- */
    function renderMetrics(all) {
        var qualified = all.filter(isQualified).length;
        var meetings = all.filter(isMeeting).length;
        var proposals = all.filter(isProposal).length;
        var closedLeads = all.filter(isClosed);
        var closed = closedLeads.length;
        var lost = all.filter(function (lead) { return lead.status === 'perdido'; }).length;

        var revenue = closedLeads.reduce(function (sum, lead) {
            var value = Number(lead.estimated_value) || Number(config.ticket) || 0;
            return sum + value;
        }, 0);

        var marginValue = revenue * (Number(config.margin) / 100);
        var roi = Number(config.budget) > 0 ? ((marginValue - Number(config.budget)) / Number(config.budget)) * 100 : 0;

        setText('kpiBudget', money(config.budget));
        setText('kpiTicket', money(config.ticket));
        setText('kpiMargin', Math.round(config.margin) + '%');
        setText('kpiLeads', all.length);
        setText('kpiQualified', qualified);
        setText('kpiMeetings', meetings);
        setText('kpiProposals', proposals);
        setText('kpiClosed', closed);
        setText('kpiConv', all.length ? pct((closed / all.length) * 100) : '0%');
        setText('kpiCpl', all.length ? money(Number(config.budget) / all.length) : '—');
        setText('kpiCpa', closed ? money(Number(config.budget) / closed) : '—');
        setText('kpiRevenue', money(revenue));
        setText('kpiRoi', closed ? (roi >= 0 ? '+' : '') + Math.round(roi) + '%' : '—');

        renderFunnel(all, lost);
        renderSources(all);
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function renderFunnel(all, lost) {
        var funnel = document.getElementById('funnel');
        if (!funnel) return;

        var counts = {};
        STATUS_ORDER.forEach(function (status) { counts[status] = 0; });
        all.forEach(function (lead) {
            if (counts[lead.status] === undefined) counts[lead.status] = 0;
            counts[lead.status] += 1;
        });

        var visible = STATUS_ORDER.filter(function (status) {
            return status !== 'perdido' || counts.perdido > 0;
        });

        var max = Math.max.apply(null, visible.map(function (status) { return counts[status]; }).concat([1]));

        funnel.innerHTML = visible.map(function (status) {
            var count = counts[status];
            var width = Math.max((count / max) * 100, count ? 3 : 0);
            return '<div class="mk-funnel-row">' +
                '<span>' + STATUS_LABELS[status] + '</span>' +
                '<div class="mk-funnel-bar"><span style="width:' + width + '%"></span></div>' +
                '<strong>' + count + '</strong>' +
                '</div>';
        }).join('');
    }

    function renderSources(all) {
        var tbody = document.querySelector('#sourceTable tbody');
        if (!tbody) return;

        var groups = {};

        all.forEach(function (lead) {
            var attr = lead.attribution || {};
            var source = attr.source || 'direto';
            var campaign = attr.campaign || '—';
            var key = source + '||' + campaign;

            if (!groups[key]) {
                groups[key] = { source: source, campaign: campaign, leads: 0, closed: 0 };
            }
            groups[key].leads += 1;
            if (isClosed(lead)) groups[key].closed += 1;
        });

        var rows = Object.keys(groups).map(function (key) { return groups[key]; })
            .sort(function (a, b) { return b.leads - a.leads; });

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="5">Sem dados de origem ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(function (row) {
            var conv = row.leads ? (row.closed / row.leads) * 100 : 0;
            return '<tr>' +
                '<td><strong>' + escapeHtml(row.source) + '</strong></td>' +
                '<td>' + escapeHtml(row.campaign) + '</td>' +
                '<td>' + row.leads + '</td>' +
                '<td>' + row.closed + '</td>' +
                '<td>' + pct(conv) + '</td>' +
                '</tr>';
        }).join('');
    }

    /* ---------------- TABELA DE LEADS ---------------- */
    function filteredLeads(all) {
        var search = (document.getElementById('leadSearch') || {}).value || '';
        var status = (document.getElementById('leadStatus') || {}).value || '';
        var offer = (document.getElementById('leadOffer') || {}).value || '';
        var term = search.trim().toLowerCase();

        return all.filter(function (lead) {
            if (status && lead.status !== status) return false;
            if (offer && lead.offer !== offer) return false;
            if (!term) return true;
            var haystack = [lead.name, lead.phone, lead.city, lead.offer, lead.challenge, lead.segment]
                .join(' ').toLowerCase();
            return haystack.indexOf(term) > -1;
        });
    }

    function renderLeads() {
        var tbody = document.getElementById('leadTableBody');
        if (!tbody) return;

        var all = leads();
        var visible = filteredLeads(all);
        var count = document.getElementById('leadCount');
        var empty = document.getElementById('emptyState');

        if (count) count.textContent = all.length + (all.length === 1 ? ' lead' : ' leads');
        if (empty) empty.style.display = all.length ? 'none' : 'block';

        if (!visible.length) {
            tbody.innerHTML = '<tr><td colspan="8">Nenhum lead encontrado com os filtros atuais.</td></tr>';
            return;
        }

        tbody.innerHTML = visible.map(function (lead) {
            var attr = lead.attribution || {};
            var source = attr.source || 'direto';
            var campaign = attr.campaign ? ' · ' + attr.campaign : '';
            var wa = 'https://wa.me/' + String(lead.phone || '').replace(/\D/g, '').replace(/^0+/, '');
            var created = lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—';
            var value = Number(lead.estimated_value) || '';

            var options = STATUS_ORDER.map(function (status) {
                return '<option value="' + status + '"' + (lead.status === status ? ' selected' : '') + '>' +
                    STATUS_LABELS[status] + '</option>';
            }).join('');

            return '<tr data-id="' + escapeHtml(lead.id) + '">' +
                '<td><strong>' + escapeHtml(lead.name || 'Sem nome') + '</strong><br /><span class="mk-badge">' + escapeHtml(lead.segment || lead.offer || '—') + '</span></td>' +
                '<td><a href="' + wa + '" target="_blank" rel="noopener">' + escapeHtml(lead.phone || '—') + '</a></td>' +
                '<td>' + escapeHtml(lead.offer || '—') + '<br /><span style="color:#7286a0;font-size:.75rem;">' + escapeHtml(lead.city || '—') + '</span></td>' +
                '<td>' + escapeHtml(source) + '<br /><span style="color:#7286a0;font-size:.72rem;">' + escapeHtml(campaign.replace(' · ', '')) + '</span></td>' +
                '<td><select data-action="status">' + options + '</select></td>' +
                '<td><input type="number" min="0" step="100" data-action="value" value="' + value + '" placeholder="' + Math.round(config.ticket) + '" /></td>' +
                '<td>' + created + '</td>' +
                '<td style="white-space:nowrap;">' +
                    '<a class="mk-btn" href="' + wa + '" target="_blank" rel="noopener" title="Abrir WhatsApp"><i class="fa-brands fa-whatsapp"></i></a> ' +
                    '<button type="button" class="mk-btn red" data-action="delete" title="Excluir lead"><i class="fa-solid fa-trash-can"></i></button>' +
                '</td>' +
                '</tr>';
        }).join('');
    }

    function initLeadTable() {
        var tbody = document.getElementById('leadTableBody');
        if (!tbody) return;

        tbody.addEventListener('change', function (event) {
            var target = event.target;
            var row = target.closest('tr');
            if (!row || !window.MSXTrack) return;
            var id = row.getAttribute('data-id');
            if (!id) return;

            if (target.getAttribute('data-action') === 'status') {
                window.MSXTrack.updateLead(id, { status: target.value });
                renderAll();
            }

            if (target.getAttribute('data-action') === 'value') {
                window.MSXTrack.updateLead(id, { estimated_value: Number(target.value) || 0 });
                renderMetrics(leads());
            }
        });

        tbody.addEventListener('click', function (event) {
            var button = event.target.closest('[data-action="delete"]');
            if (!button) return;
            var row = button.closest('tr');
            var id = row.getAttribute('data-id');
            if (!id || !window.MSXTrack) return;
            if (!window.confirm('Excluir este lead do painel local?')) return;
            window.MSXTrack.removeLead(id);
            renderAll();
        });

        ['leadSearch', 'leadStatus', 'leadOffer'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', renderLeads);
            if (el) el.addEventListener('change', renderLeads);
        });
    }

    /* ---------------- CADASTRO MANUAL ---------------- */
    function initManualForm() {
        var form = document.getElementById('manualForm');
        if (!form) return;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!window.MSXTrack) return;

            var name = document.getElementById('mName').value.trim();
            var phone = document.getElementById('mPhone').value.trim();
            if (!name || !phone) return;

            var lead = window.MSXTrack.addLead({
                name: name,
                phone: phone,
                city: document.getElementById('mCity').value.trim(),
                offer: document.getElementById('mOffer').value,
                segment: document.getElementById('mSegment').value,
                challenge: 'Cadastro manual / prospecção',
                has_system: 'Não informado',
                status: document.getElementById('mStatus').value,
                notes: 'Lead cadastrado manualmente no painel'
            });

            window.MSXTrack.updateLead(lead.id, {
                attribution: {
                    source: document.getElementById('mSource').value,
                    medium: 'manual',
                    campaign: 'prospeccao-ativa',
                    landing_page: 'marketing/painel.html'
                }
            });

            form.reset();
            renderAll();
            window.alert('Lead adicionado ao painel local.');
        });
    }

    /* ---------------- AÇÕES ---------------- */
    function initActions() {
        var exportBtn = document.getElementById('exportCsv');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                var all = leads();
                if (!all.length) {
                    window.alert('Não há leads para exportar.');
                    return;
                }

                var header = ['id', 'created_at', 'name', 'phone', 'city', 'segment', 'offer', 'challenge', 'has_system', 'status', 'estimated_value', 'source', 'medium', 'campaign', 'page'];
                var lines = all.map(function (lead) {
                    var attr = lead.attribution || {};
                    return [
                        lead.id, lead.created_at, lead.name, lead.phone, lead.city, lead.segment,
                        lead.offer, lead.challenge, lead.has_system, lead.status, lead.estimated_value,
                        attr.source, attr.medium, attr.campaign, lead.page
                    ].map(function (value) {
                        return '"' + String(value === undefined || value === null ? '' : value).replace(/"/g, '""') + '"';
                    }).join(',');
                });

                var csv = '\ufeff' + header.join(',') + '\n' + lines.join('\n');
                var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = 'msx-leads-' + new Date().toISOString().slice(0, 10) + '.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });
        }

        var seedBtn = document.getElementById('seedDemo');
        if (seedBtn) {
            seedBtn.addEventListener('click', function () {
                if (!window.MSXTrack) return;
                if (!window.confirm('Inserir 8 leads de exemplo para testar o painel? Eles podem ser removidos depois.')) return;

                var demo = [
                    { name: 'Carlos M.', phone: '(43) 99911-1001', city: 'Assaí - PR', segment: 'Agronegócio', offer: 'Automação Rural', challenge: 'Irrigação e consumo de água', status: 'fechado', source: 'google', campaign: 'agro-automacao', value: 12000 },
                    { name: 'Fernanda L.', phone: '(43) 99911-1002', city: 'Londrina - PR', segment: 'Indústria', offer: 'Automação Industrial', challenge: 'Paradas e manutenção', status: 'negociacao', source: 'google', campaign: 'industria-diagnostico', value: 24000 },
                    { name: 'Rafael T.', phone: '(43) 99911-1003', city: 'Cornélio Procópio - PR', segment: 'Empresas', offer: 'Sistemas Personalizados', challenge: 'Planilhas e controles manuais', status: 'proposta', source: 'meta', campaign: 'sistemas-planilhas', value: 9000 },
                    { name: 'Juliana P.', phone: '(43) 99911-1004', city: 'Bandeirantes - PR', segment: 'Agronegócio', offer: 'Automação Rural', challenge: 'Bombas, poços e reservatórios', status: 'diagnostico', source: 'meta', campaign: 'agro-monitoramento', value: 0 },
                    { name: 'Eduardo S.', phone: '(43) 99911-1005', city: 'Ibiporã - PR', segment: 'Indústria', offer: 'Automação Industrial', challenge: 'Falta de indicadores', status: 'qualificado', source: 'google', campaign: 'industria-diagnostico', value: 0 },
                    { name: 'Patrícia A.', phone: '(43) 99911-1006', city: 'Londrina - PR', segment: 'Empresas', offer: 'Dados e IA', challenge: 'Relatórios manuais', status: 'novo', source: 'instagram', campaign: 'reels-dados', value: 0 },
                    { name: 'Marcos V.', phone: '(43) 99911-1007', city: 'Cambé - PR', segment: 'Empresas', offer: 'Sistemas Personalizados', challenge: 'Sistema atual não atende', status: 'fechado', source: 'indicacao', campaign: '—', value: 15000 },
                    { name: 'Ana C.', phone: '(43) 99911-1008', city: 'Arapongas - PR', segment: 'Indústria', offer: 'Automação Industrial', challenge: 'Integração máquinas e ERP', status: 'perdido', source: 'meta', campaign: 'industria-integração', value: 0 }
                ];

                demo.forEach(function (item, index) {
                    var created = new Date();
                    created.setDate(created.getDate() - index * 3);
                    var lead = window.MSXTrack.addLead({
                        name: item.name,
                        phone: item.phone,
                        city: item.city,
                        segment: item.segment,
                        offer: item.offer,
                        challenge: item.challenge,
                        has_system: 'Exemplo',
                        status: item.status,
                        estimated_value: item.value,
                        created_at: created.toISOString(),
                        notes: '[exemplo] remover após o teste'
                    });
                    window.MSXTrack.updateLead(lead.id, {
                        attribution: {
                            source: item.source,
                            medium: item.source === 'indicacao' ? 'referral' : 'cpc',
                            campaign: item.campaign,
                            landing_page: 'exemplo'
                        }
                    });
                });

                renderAll();
            });
        }

        var clearBtn = document.getElementById('clearLeads');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (!window.MSXTrack) return;
                if (!window.confirm('Apagar todos os leads salvos neste navegador? Esta ação não pode ser desfeita.')) return;
                window.MSXTrack.clearLeads();
                renderAll();
            });
        }
    }

    /* ---------------- RENDER GERAL ---------------- */
    function renderAll() {
        var all = leads();
        renderMetrics(all);
        renderLeads();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initConfig();
        initLeadTable();
        initManualForm();
        initActions();
        renderAll();

        window.addEventListener('msx:leads-updated', renderAll);
        window.addEventListener('storage', function (event) {
            if (event.key === 'msx_leads_v1' || event.key === CONFIG_KEY) {
                config = loadConfig();
                renderAll();
            }
        });
    });
})();
