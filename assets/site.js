/* NPA Support Services — interactions */
(function () {
  'use strict';

  // Nav: shrink / frost on scroll
  var nav = document.querySelector('.nav');
  var floatCta = document.querySelector('.float-cta');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 40);
    if (floatCta) floatCta.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile drawer
  var tog = document.querySelector('.mob-tog');
  var drawer = document.querySelector('.mdrawer');
  function setDrawer(open) {
    if (!drawer || !tog) return;
    drawer.classList.toggle('open', open);
    tog.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (tog) tog.addEventListener('click', function () {
    setDrawer(!drawer.classList.contains('open'));
  });
  if (drawer) drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  // Fade-in on scroll
  var faders = document.querySelectorAll('.fade');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    faders.forEach(function (el) { io.observe(el); });
  } else {
    faders.forEach(function (el) { el.classList.add('vis'); });
  }
  // Failsafe: content must never stay hidden if the observer misbehaves
  setTimeout(function () {
    document.querySelectorAll('.fade:not(.vis)').forEach(function (el) { el.classList.add('vis'); });
  }, 2000);

  // Current year in footer
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // ─── Referral modal (Splose forms) ───
  var SPLOSE_FORMS = {
    pbs: { label: 'Positive Behaviour Support', url: 'https://npa-support-services.splose.com/public-form/452b2577-997a-4104-87d0-43651cd2dfba' },
    sc:  { label: 'Support Coordination', url: 'https://npa-support-services.splose.com/public-form/39b941c2-b121-435d-96a7-b6077ed4e72a' }
  };

  function buildReferralModal() {
    if (document.getElementById('refModal')) return;
    var m = document.createElement('div');
    m.id = 'refModal';
    m.className = 'ref-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', 'Make a referral');
    m.innerHTML =
      '<div class="ref-modal-backdrop" data-ref-close></div>' +
      '<div class="ref-modal-dialog">' +
        '<button class="ref-modal-close" data-ref-close aria-label="Close">&times;</button>' +
        '<div class="ref-modal-head">' +
          '<div class="ref-modal-title">Make a Referral</div>' +
          '<div class="splose-tabs" role="tablist">' +
            '<button class="splose-tab active" id="rm-tab-pbs" role="tab" onclick="window.__refTab(\'pbs\')">Positive Behaviour Support</button>' +
            '<button class="splose-tab" id="rm-tab-sc" role="tab" onclick="window.__refTab(\'sc\')">Support Coordination</button>' +
          '</div>' +
          '<p class="splose-note" id="rm-ssc-note" style="display:none">Specialist Support Coordination? Use the Support Coordination form and mention it in your referral.</p>' +
        '</div>' +
        '<div class="ref-modal-body">' +
          '<iframe id="rm-frame-pbs" title="Positive Behaviour Support referral form" scrolling="auto"></iframe>' +
          '<iframe id="rm-frame-sc" title="Support Coordination referral form" scrolling="auto" style="display:none"></iframe>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-ref-close]')) closeReferralModal();
    });
  }

  window.__refTab = function (key) {
    ['pbs', 'sc'].forEach(function (k) {
      var on = k === key;
      var fr = document.getElementById('rm-frame-' + k);
      fr.style.display = on ? 'block' : 'none';
      if (on && !fr.src) fr.src = SPLOSE_FORMS[k].url;
      var t = document.getElementById('rm-tab-' + k);
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var note = document.getElementById('rm-ssc-note');
    if (note) note.style.display = key === 'sc' ? 'block' : 'none';
  };

  function openReferralModal(key) {
    buildReferralModal();
    window.__refTab(key === 'sc' || key === 'ssc' ? 'sc' : 'pbs');
    document.getElementById('refModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeReferralModal() {
    var m = document.getElementById('refModal');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeReferralModal();
  });

  // Any link to referrals.html opens the popup instead (page remains as no-JS fallback)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="referrals.html"]');
    if (!a || a.hasAttribute('data-no-modal')) return;
    e.preventDefault();
    setDrawer(false);
    var q = (a.getAttribute('href').split('form=')[1] || '').replace(/[^a-z]/g, '');
    openReferralModal(q);
  });

  // Highlight current page in nav + drawer (handles /about and /about.html)
  var here = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  document.querySelectorAll('.nav-l a, .mdrawer-list a').forEach(function (a) {
    var target = (a.getAttribute('href') || '').split('#')[0].replace(/\.html$/, '');
    if (target && target === here) a.classList.add('active');
  });

  // Web3Forms submission for any form marked data-w3form
  document.querySelectorAll('form[data-w3form]').forEach(function (form) {
    var status = form.querySelector('.cf-status');
    var submitBtn = form.querySelector('.cf-submit');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      // require at least one box ticked in any data-require-group container
      var groupFail = null;
      form.querySelectorAll('[data-require-group]').forEach(function (g) {
        if (!g.querySelector('input:checked')) groupFail = g;
      });
      if (groupFail) {
        groupFail.scrollIntoView({ behavior: 'smooth', block: 'center' });
        status.textContent = groupFail.getAttribute('data-require-group');
        status.className = 'cf-status err';
        return;
      }
      status.className = 'cf-status';
      submitBtn.disabled = true;
      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = (data[k] !== undefined) ? data[k] + ', ' + v : v;
      });
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.success) {
          status.textContent = form.getAttribute('data-success') || 'Thanks — your message has been sent. We’ll be in touch soon.';
          status.className = 'cf-status ok';
          form.reset();
          status.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error(res.message || 'error');
        }
      }).catch(function () {
        status.textContent = 'Sorry, something went wrong. Please email nadia@npasupportservices.com.au instead.';
        status.className = 'cf-status err';
      }).finally(function () { submitBtn.disabled = false; });
    });
  });
})();
