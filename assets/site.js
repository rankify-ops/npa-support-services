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

  // Current year in footer
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

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
