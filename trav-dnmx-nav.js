/* Traversion Dynamics: navbar behaviour (mobile menu, card jumps, active state). */
(function () {
  "use strict";

  var nav = document.getElementById("siteNav");
  if (!nav) { return; }

  var toggle = nav.querySelector(".nav-toggle");
  var isHome = document.body.getAttribute("data-page") === "home";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hashMap = { home: 0, systems: 2, contact: 3 };

  function goTo(index, instant) {
    var card;
    if (reduceMotion) {
      card = document.querySelector('.zcard[data-card="' + (index + 1) + '"]');
      if (card) { card.scrollIntoView(); }
      return;
    }
    window.scrollTo({ top: index * window.innerHeight, behavior: instant ? "auto" : "smooth" });
  }

  function closeMenu() {
    nav.classList.remove("open");
    if (toggle) { toggle.setAttribute("aria-expanded", "false"); }
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeMenu(); }
  });

  /* on the home page, links that target a scroll card jump to it */
  Array.prototype.forEach.call(document.querySelectorAll("a[data-card]"), function (link) {
    link.addEventListener("click", function (e) {
      closeMenu();
      if (!isHome) { return; }
      e.preventDefault();
      goTo(parseInt(link.getAttribute("data-card"), 10), false);
    });
  });

  if (!isHome) { return; }

  /* arriving from another page with #systems or #contact */
  var hash = window.location.hash.replace("#", "");
  if (Object.prototype.hasOwnProperty.call(hashMap, hash)) {
    setTimeout(function () { goTo(hashMap[hash], true); }, 60);
  }

  /* highlight the nav link for the card in view */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll(".nav-links a[data-card]:not(.nav-cta)"));

  function updateActive() {
    var i = Math.round((window.scrollY || window.pageYOffset || 0) / window.innerHeight);
    var target = i <= 1 ? 0 : i;
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", parseInt(link.getAttribute("data-card"), 10) === target);
    });
  }

  if (!reduceMotion) {
    window.addEventListener("scroll", function () { window.requestAnimationFrame(updateActive); }, { passive: true });
    updateActive();
  }
})();
