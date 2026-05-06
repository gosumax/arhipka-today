(() => {
  const CONSENT_VERSION = "2026-05-03";
  const STORAGE_KEYS = {
    required: "requiredPersonalDataConsent",
    marketing: "marketingConsent",
    version: "consentVersion",
    acceptedAt: "consentAcceptedAt",
    cookie: "cookieConsent",
    cookieAcceptedAt: "cookieConsentAcceptedAt"
  };

  const getStoredConsent = () => {
    try {
      return {
        required: localStorage.getItem(STORAGE_KEYS.required) === "true",
        version: localStorage.getItem(STORAGE_KEYS.version)
      };
    } catch {
      return { required: false, version: null };
    }
  };


  const withTrailingSlash = (url) => {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.origin !== window.location.origin) return url;
      if (!parsed.pathname || parsed.pathname === "/" || parsed.pathname.endsWith("/")) return url;
      if (parsed.pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(parsed.pathname)) return url;
      parsed.pathname = `${parsed.pathname}/`;
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      return url;
    }
  };

  const installTrailingSlashNavigationGuard = () => {
    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.("a[href]");
      if (!link) return;
      const originalHref = link.getAttribute("href") || "";
      if (!originalHref || originalHref.startsWith("#") || originalHref.startsWith("tel:") || originalHref.startsWith("mailto:")) return;
      const fixedHref = withTrailingSlash(originalHref);
      if (fixedHref !== originalHref) link.setAttribute("href", fixedHref);
    }, true);
  };

  const enforceTrailingSlashOnCurrentUrl = () => {
    const currentRelativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const normalizedRelativeUrl = withTrailingSlash(currentRelativeUrl);
    if (!normalizedRelativeUrl || normalizedRelativeUrl === currentRelativeUrl) return false;
    window.location.replace(normalizedRelativeUrl);
    return true;
  };

  const hasCurrentRequiredConsent = () => {
    const stored = getStoredConsent();
    return stored.required && stored.version === CONSENT_VERSION;
  };

  window.logConsentEvent = window.logConsentEvent || ((eventName, payload = {}) => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.info("[consent]", eventName, payload);
    }
  });

  const storePersonalConsent = (marketingConsent) => {
    const acceptedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.required, "true");
    localStorage.setItem(STORAGE_KEYS.marketing, marketingConsent ? "true" : "false");
    localStorage.setItem(STORAGE_KEYS.version, CONSENT_VERSION);
    localStorage.setItem(STORAGE_KEYS.acceptedAt, acceptedAt);
    window.logConsentEvent("personal_data_consent_accepted", {
      requiredPersonalDataConsent: true,
      marketingConsent: Boolean(marketingConsent),
      consentVersion: CONSENT_VERSION,
      consentAcceptedAt: acceptedAt
    });
  };

  const revealPhone = (trigger) => {
    const phoneDisplay = trigger.dataset.phoneDisplay || "+7 979 033-97-39";
    const phoneHref = trigger.dataset.phoneHref || "tel:+79790339739";
    const scope = trigger.closest(".service-booking, .legal-document, .site-footer, body") || document;
    const link = scope.querySelector("[data-phone-link]");

    if (link) {
      link.href = phoneHref;
      link.textContent = phoneDisplay;
      link.classList.remove("is-hidden");
    }

    trigger.classList.add("is-hidden");
  };

  const createConsentModal = (trigger) => {
    const overlay = document.createElement("div");
    overlay.className = "consent-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "consent-modal-title");
    overlay.innerHTML = `
      <div class="consent-modal__panel">
        <button class="consent-modal__close" type="button" aria-label="Закрыть">×</button>
        <h2 id="consent-modal-title">Согласие на обработку персональных данных</h2>
        <p>Перед показом контактов подтвердите согласие на обработку персональных данных для обратной связи.</p>
        <label class="consent-check">
          <input type="checkbox" data-required-consent />
          <span>Я принимаю <a href="/privacy/" target="_blank" rel="noopener">Политику обработки персональных данных</a> и даю согласие на обработку данных для обратной связи.</span>
        </label>
        <label class="consent-check">
          <input type="checkbox" data-marketing-consent />
          <span>Дополнительно соглашаюсь на получение информационных и рекламных сообщений.</span>
        </label>
        <div class="consent-links">
          <a href="/privacy/" target="_blank" rel="noopener">Политика обработки персональных данных</a>
          <a href="/personal-data-consent/" target="_blank" rel="noopener">Согласие на обработку персональных данных</a>
          <a href="/marketing-consent/" target="_blank" rel="noopener">Согласие на получение рекламных сообщений</a>
        </div>
        <button class="button button-primary" type="button" data-confirm-consent disabled>Подтвердить согласие</button>
      </div>
    `;

    const requiredInput = overlay.querySelector("[data-required-consent]");
    const marketingInput = overlay.querySelector("[data-marketing-consent]");
    const confirmButton = overlay.querySelector("[data-confirm-consent]");
    const closeButton = overlay.querySelector(".consent-modal__close");
    const close = () => overlay.remove();

    requiredInput.addEventListener("change", () => {
      confirmButton.disabled = !requiredInput.checked;
    });
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", function onKeydown(event) {
      if (!document.body.contains(overlay)) {
        document.removeEventListener("keydown", onKeydown);
        return;
      }
      if (event.key === "Escape") close();
    });
    confirmButton.addEventListener("click", () => {
      if (!requiredInput.checked) return;
      storePersonalConsent(marketingInput.checked);
      revealPhone(trigger);
      close();
    });

    document.body.append(overlay);
    requiredInput.focus();
  };

  const bindPhoneReveal = () => {
    const triggers = document.querySelectorAll("[data-reveal-phone]");
    triggers.forEach((trigger) => {
      if (trigger.dataset.phoneRevealBound === "true") return;
      trigger.dataset.phoneRevealBound = "true";
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (hasCurrentRequiredConsent()) {
          revealPhone(trigger);
          return;
        }
        createConsentModal(trigger);
      });
    });
  };

  const bindCookieBanner = () => {
    const banner = document.querySelector("[data-cookie-banner]");
    if (!banner) return;

    const acceptButton = banner.querySelector("[data-cookie-accept]");
    const rejectButton = banner.querySelector("[data-cookie-reject]");
    if (!acceptButton || !rejectButton) return;

    try {
      const state = localStorage.getItem(STORAGE_KEYS.cookie);
      if (state) {
        banner.remove();
        return;
      }
    } catch {
      return;
    }

    const applyChoice = (accepted) => {
      try {
        localStorage.setItem(STORAGE_KEYS.cookie, accepted ? "accepted" : "rejected");
        localStorage.setItem(STORAGE_KEYS.cookieAcceptedAt, new Date().toISOString());
      } catch {}
      banner.remove();
    };

    acceptButton.addEventListener("click", () => applyChoice(true));
    rejectButton.addEventListener("click", () => applyChoice(false));
  };

  if (enforceTrailingSlashOnCurrentUrl()) return;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installTrailingSlashNavigationGuard();
      bindPhoneReveal();
      bindCookieBanner();
    });
  } else {
    installTrailingSlashNavigationGuard();
    bindPhoneReveal();
    bindCookieBanner();
  }
})();
