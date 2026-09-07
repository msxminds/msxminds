/* ============================================
   MSX MINDS - JavaScript Principal
   Automação, IA & Engenharia de Sistemas
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initBannerHeight();
    initModals();
    initVideoPlayer();
    initCounters();
    initPillarCounters();
    initScrollReveal();
    initMenuSticky();
    initBackToTop();
    initSmoothScroll();
    initParticles();
    initTypingEffect();
    initCardGlow();
    initLeadPopup();
    initStickyCta();
});

/* --- CALCULADORA DE ROI --- */
function calculateROI() {
    const energyBill = parseFloat(document.getElementById('energyBill').value) || 0;
    const employees = parseFloat(document.getElementById('employees').value) || 0;
    const downtime = parseFloat(document.getElementById('downtime').value) || 0;

    // Cálculos baseados em médias do mercado
    const energySavings = Math.round(energyBill * 12 * 0.85); // 85% economia com solar
    const productivityGain = Math.min(Math.round(employees * 1.75), 100); // +35% produtividade
    const downtimeReduction = Math.round(downtime * 0.6); // 60% redução paradas
    const avgSavingsPerEmployee = 2500; // R$ 2.500/funcionário/ano
    const productivitySavings = employees * avgSavingsPerEmployee * (productivityGain / 100);
    const downtimeSavings = downtime * 500 * 12; // R$ 500/hora parada
    const totalSavings = Math.round(energySavings + productivitySavings + downtimeSavings);

    // Animação dos números
    animateValue('energySavings', 0, energySavings, 'R$ ');
    animateValue('productivityGain', 0, productivityGain, '+', '%');
    animateValue('downtimeReduction', 0, downtimeReduction, '-', 'h');
    animateValue('totalSavings', 0, totalSavings, 'R$ ');

    // Mostrar resultados
    document.getElementById('roiResults').style.display = 'block';
    document.getElementById('roiResults').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function animateValue(elementId, start, end, prefix = '', suffix = '') {
    const element = document.getElementById(elementId);
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * eased);
        element.textContent = prefix + current.toLocaleString('pt-BR') + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/* --- BARRA CTA STICKY --- */
function initStickyCta() {
    const stickyBar = document.getElementById('stickyCta');
    if (!stickyBar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 600) {
            stickyBar.classList.add('visible');
        } else {
            stickyBar.classList.remove('visible');
        }
    });
}

/* --- ALTURA DINÂMICA DO BANNER --- */
function initBannerHeight() {
    const banner = document.querySelector('.banner-top-container');
    const image = document.querySelector('.banner-image');
    if (!banner || !image) return;

    function updateHeight() {
        const bannerHeight = banner.offsetHeight;
        const isMobile = window.innerWidth <= 768;
        const offset = isMobile ? 15 : 20;
        document.body.style.paddingTop = (bannerHeight + offset) + 'px';
    }

    if (image.complete) {
        updateHeight();
    } else {
        image.addEventListener('load', updateHeight);
    }

    window.addEventListener('resize', updateHeight);
    setTimeout(updateHeight, 100);
    setTimeout(updateHeight, 500);
}

/* --- MODAIS DO BLOG --- */
function initModais() {
    const openButtons = document.querySelectorAll('[data-modal]');
    const closeButtons = document.querySelectorAll('[data-close]');
    const overlays = document.querySelectorAll('.modal-overlay');

    openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            overlays.forEach(overlay => {
                overlay.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });
}

/* --- VIDEO PLAYER MODAL --- */
function initVideoPlayer() {
    const videoButtons = document.querySelectorAll('[data-video]');
    
    const playerHTML = `
        <div class="modal-overlay" id="video-modal">
            <div class="modal-container" style="max-width: 900px;">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-play-circle"></i> PODCAST MSX MINDS</h2>
                    <button class="modal-close" id="close-video">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <video id="video-player" controls style="width: 100%; display: block; border-radius: 0 0 12px 12px;">
                        Seu navegador não suporta vídeos HTML5.
                    </video>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', playerHTML);
    
    const videoModal = document.getElementById('video-modal');
    const videoPlayer = document.getElementById('video-player');
    const closeVideo = document.getElementById('close-video');
    
    videoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const videoSrc = btn.getAttribute('data-video');
            if (videoPlayer && videoSrc) {
                videoPlayer.src = videoSrc;
                videoModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                videoPlayer.play().catch(() => {});
            }
        });
    });
    
    if (closeVideo) {
        closeVideo.addEventListener('click', () => {
            videoModal.classList.remove('active');
            videoPlayer.pause();
            videoPlayer.src = '';
            document.body.style.overflow = '';
        });
    }
    
    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                videoModal.classList.remove('active');
                videoPlayer.pause();
                videoPlayer.src = '';
                document.body.style.overflow = '';
            }
        });
    }
}

/* --- CONTADORES ANIMADOS --- */
function initCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length === 0) return;

    const observerOptions = { threshold: 0.5 };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent;
                const match = text.match(/(\d+)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = text.replace(match[1], '');
                    animateCounter(el, 0, target, 2000, suffix);
                }
                observer.unobserve(el);
            }
        });
    }, observerOptions);

    statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(el, start, end, duration, suffix) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * eased);
        el.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/* --- CONTADORES DOS PILARES --- */
function initPillarCounters() {
    const pillarNumbers = document.querySelectorAll('.pillar-stat-number');
    if (pillarNumbers.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'));
                if (target) {
                    animateCounter(el, 0, target, 2000, '');
                }
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    pillarNumbers.forEach(el => observer.observe(el));
}

/* --- SCROLL REVEAL (ANIMAÇÕES DE ENTRADA) --- */
function initScrollReveal() {
    const elements = document.querySelectorAll(
        '.card-3d, .about-card, .diff-card, .stat-item, .sector-badge, .footer-section, .pillar-card, .tech-item, .testimonial-card, .faq-card, .trust-badge, .hero-social-proof, .hero-guarantee'
    );
    
    if (elements.length === 0) return;

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}

/* --- MENU STICKY --- */
function initMenuSticky() {
    const menu = document.querySelector('.menu-container');
    if (!menu) return;

    const menuTop = menu.offsetTop;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > menuTop) {
            menu.classList.add('menu-sticky');
        } else {
            menu.classList.remove('menu-sticky');
        }
    });
}

/* --- BOTÃO VOLTAR AO TOPO --- */
function initBackToTop() {
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* --- SMOOTH SCROLL PARA ANCHORS --- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* --- PARTÍCULAS DE FUNDO (HERO) --- */
function initParticles() {
    const hero = document.querySelector('.hero-cyber');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    canvas.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 0;
    `;
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = Math.random() > 0.5 ? '0, 242, 254' : '155, 81, 224';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 60; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 242, 254, ${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        animationId = requestAnimationFrame(animate);
    }
    animate();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) animate();
            } else {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        });
    });
    observer.observe(hero);
}

/* --- TYPING EFFECT NO HERO --- */
function initTypingEffect() {
    const badge = document.querySelector('.system-badge');
    if (!badge) return;

    const originalText = badge.innerHTML;
    const textContent = badge.textContent;
    
    badge.innerHTML = '<i class="fa-solid fa-microchip"></i> ';
    badge.style.borderRight = '2px solid #00f2fe';
    
    let charIndex = 0;
    const prefix = '<i class="fa-solid fa-microchip"></i> ';
    
    function typeChar() {
        if (charIndex < textContent.length) {
            badge.innerHTML = prefix + textContent.substring(0, charIndex + 1);
            charIndex++;
            setTimeout(typeChar, 50);
        } else {
            setTimeout(() => {
                badge.style.borderRight = 'none';
            }, 2000);
        }
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                typeChar();
                observer.unobserve(entry.target);
            }
        });
    });
    observer.observe(badge);
}

/* --- POPUP CAPTURA DE LEADS --- */
function initLeadPopup() {
    const popup = document.getElementById('leadPopup');
    const closeBtn = document.getElementById('closePopup');
    
    if (!popup) return;

    // Mostrar popup após 30 segundos (ou após scroll de 50%)
    let shown = false;
    
    function showPopup() {
        if (!shown) {
            popup.classList.add('active');
            shown = true;
            sessionStorage.setItem('leadPopupShown', 'true');
        }
    }

    // Não mostrar se já foi mostrado nesta sessão
    if (sessionStorage.getItem('leadPopupShown')) {
        popup.style.display = 'none';
        return;
    }

    // Mostrar após 30 segundos
    setTimeout(showPopup, 30000);

    // OU mostrar após scroll de 50%
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > 50) {
            showPopup();
        }
    });

    // Fechar popup
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            popup.classList.remove('active');
        });
    }

    // Fechar ao clicar fora
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('active');
        }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            popup.classList.remove('active');
        }
    });
}

/* --- GLOW NOS CARDS AO MOVER O MOUSE --- */
function initCardGlow() {
    const cards = document.querySelectorAll('.card-3d');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            card.classList.add('card-glow-active');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-glow-active');
        });
    });
}

/* --- MENU MOBILE HAMBURGER --- */
function initMobileMenu() {
    const menu = document.querySelector('.menu-container');
    if (!menu) return;

    let hamburger = document.querySelector('.hamburger-btn');
    if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Menu');
        menu.parentNode.insertBefore(hamburger, menu);
    }

    hamburger.addEventListener('click', () => {
        menu.classList.toggle('menu-open');
        hamburger.classList.toggle('active');
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            menu.classList.remove('menu-open');
            hamburger.classList.remove('active');
        });
    });
}

/* --- DETECÇÃO DE MOBILE --- */
function isMobile() {
    return window.innerWidth <= 768;
}

if (isMobile()) {
    initMobileMenu();
}

window.addEventListener('resize', () => {
    if (isMobile()) {
        initMobileMenu();
    }
});
