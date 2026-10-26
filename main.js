/* Noyau commun du motion : scroll fluide, titres masqués, apparitions, compteurs.
   Tout ce qui est propre au site est dans la partie "SITE" plus bas. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* accordéon : fonctionne même sans animation */
  $$('.acc__h').forEach(b => b.addEventListener('click', () => {
    const a = b.closest('.acc'), open = !a.classList.contains('is-open');
    a.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 600);
  }));

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || reduce) {
    root.classList.remove('js'); window.__ready = true; return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const desktop = matchMedia('(min-width:901px)').matches;
    const hover = matchMedia('(hover:hover)').matches;

    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { duration: 1.3, offset: 0 });
    }));

    /* barre du haut, progression, lien actif */
    const top = $('[data-top]'), prog = $('[data-progress]');
    const links = $$('[data-nav] a[href^="#"]');
    const secs = links.map(a => $(a.getAttribute('href')));
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        if (top) top.classList.toggle('is-solid', self.scroll() > 24);
        if (prog) gsap.set(prog, { scaleX: self.progress });
        const line = innerHeight * 0.4;
        secs.forEach((s, i) => {
          if (!s) return;
          const r = s.getBoundingClientRect();
          links[i].classList.toggle('is-active', r.top <= line && r.bottom >= line);
        });
      }
    });

    /* titres : lignes masquées */
    $$('[data-split]').forEach(el => {
      const d = parseFloat(el.dataset.delay || 0);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, { yPercent: 118, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: d,
            scrollTrigger: { trigger: el, start: 'top 90%' } });
        }
      });
    });

    /* apparitions par lots */
    const items = $$('[data-r]');
    gsap.set(items, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: true })
    });

    /* compteurs */
    $$('[data-count]').forEach(el => {
      const end = parseInt(el.dataset.count, 10), o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 1.8, delay: 0.3, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });

    /* boutons magnétiques */
    if (hover) $$('.btn').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
      btn.addEventListener('mouseleave', () => { x(0); y(0); });
    });

    /* ===== SITE ===== */
    /* entrée du portrait et de l'étiquette */
    gsap.from('.hero__ph img', { yPercent: 14, duration: 1.4, ease: 'power4.out', delay: 0.2 });
    gsap.from('.hero__ph figcaption', { scale: 0, rotate: -20, duration: 0.9, ease: 'back.out(2)', delay: 1.2 });
    /* cartes d'expérience : chaque carte se tasse un peu quand la suivante la recouvre */
    if (desktop) {
      const cards = $$('.card');
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(c, { scale: 0.94 - (cards.length - i) * 0.004, yPercent: -2, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 82%', end: 'top 22%', scrub: true } });
      });
    }
    /* la bande de mots accélère avec le défilement */
    const band = $('.band__in');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => {
      const v = Math.min(Math.abs(s.getVelocity()) / 1400, 3);
      band.style.animationDuration = (40 / (1 + v)) + 's';
    }});
    /* le nom géant : léger glissement horizontal à la descente */
    if (desktop) gsap.to('.giant', { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    /* blocs compétences : arrivée en décalé */
    $$('.blk').forEach((b, i) => gsap.from(b, { y: 60 + i * 30, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.blocks', start: 'top 85%' } }));
    /* ===== FIN SITE ===== */
  });

  const refresh = () => ScrollTrigger.refresh();
  addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.__ready = true;
})();
