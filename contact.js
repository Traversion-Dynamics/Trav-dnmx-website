/* Traversion Dynamics: contact form.

   HOW SUBMISSION WORKS
   1. If CONFIG.endpoint is set, the form is POSTed there as JSON
      (works with Formspree, Web3Forms, Basin, your own API, etc.).
   2. Otherwise, if CONFIG.email is set, the visitor's mail app opens with the
      message prefilled (mailto fallback).
   3. If neither is set, the form validates but tells the visitor that the
      destination is not configured yet.
*/
(function () {
  "use strict";

  var CONFIG = {
    endpoint: "",   // e.g. "https://formspree.io/f/xxxxxxxx"
    email: "",      // e.g. "contact@your-domain.com"
    subjectPrefix: "Traversion Dynamics enquiry"
  };

  var form = document.getElementById("contactForm");
  if (!form) { return; }

  var status = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");
  var topicLabels = {
    briefing: "Request a briefing",
    border: "Border perimeter defense",
    "counter-uav": "Counter-UAV protection",
    maritime: "Coastal and maritime security",
    recon: "Analysis and recon planning",
    partnership: "Partnership",
    security: "Security disclosure",
    other: "Something else"
  };

  /* preselect topic from ?topic= */
  var params = new URLSearchParams(window.location.search);
  var preset = params.get("topic");
  if (preset && Object.prototype.hasOwnProperty.call(topicLabels, preset)) {
    form.elements.topic.value = preset;
  }

  function field(name) { return form.elements[name].closest(".c-field") || form.elements[name].closest(".c-consent"); }

  function setError(name, message) {
    var wrap = field(name);
    var holder = form.querySelector('[data-error-for="' + name + '"]');
    if (wrap) { wrap.classList.toggle("has-error", !!message); }
    if (holder) { holder.textContent = message || ""; }
    form.elements[name].setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    var el = form.elements;
    var ok = true;
    var firstBad = null;

    function check(name, bad, message) {
      if (bad) {
        setError(name, message);
        ok = false;
        if (!firstBad) { firstBad = el[name]; }
      } else {
        setError(name, "");
      }
    }

    check("name", el.name.value.trim().length < 2, "Please enter your name.");
    check("email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim()), "Please enter a valid email address.");
    check("topic", !el.topic.value, "Please choose a topic.");
    check("message", el.message.value.trim().length < 10, "Please write at least a short message (10 characters).");
    check("consent", !el.consent.checked, "Please confirm so we can reply to you.");

    if (firstBad) { firstBad.focus(); }
    return ok;
  }

  function showStatus(state, message) {
    status.className = "c-status show";
    status.setAttribute("data-state", state);
    status.textContent = message;
  }

  function collect() {
    var el = form.elements;
    return {
      name: el.name.value.trim(),
      organization: el.organization.value.trim(),
      email: el.email.value.trim(),
      role: el.role.value.trim(),
      topic: topicLabels[el.topic.value] || el.topic.value,
      message: el.message.value.trim(),
      source: "traversion-contact-page"
    };
  }

  function success() {
    form.reset();
    showStatus("success", "Thank you. Your message has been sent and we will be in touch.");
    status.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function sendMailto(data) {
    var subject = CONFIG.subjectPrefix + ": " + data.topic;
    var body = "Name: " + data.name + "\n" +
      "Organization: " + data.organization + "\n" +
      "Role: " + data.role + "\n" +
      "Email: " + data.email + "\n" +
      "Topic: " + data.topic + "\n\n" + data.message;
    window.location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    showStatus("success", "Your email app should now open with the message ready to send. If it did not, write to " + CONFIG.email + ".");
  }

  /* clear an error as soon as the visitor fixes it */
  ["name", "email", "topic", "message", "consent"].forEach(function (name) {
    var evt = (name === "topic" || name === "consent") ? "change" : "input";
    form.elements[name].addEventListener(evt, function () {
      if (field(name).classList.contains("has-error")) { setError(name, ""); }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "c-status";

    /* honeypot: bots fill hidden fields */
    if (form.elements.website.value) { success(); return; }

    if (!validate()) { return; }
    var data = collect();

    if (CONFIG.endpoint) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) { throw new Error("bad status " + res.status); }
        success();
      }).catch(function () {
        showStatus("error", "Something went wrong and your message was not sent. Please try again in a moment.");
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      });
    } else if (CONFIG.email) {
      sendMailto(data);
    } else {
      showStatus("error", "The form is ready, but no destination is set up yet. Set an endpoint or email in contact.js to start receiving messages.");
    }
  });
})();
