const CONSENT_STORAGE_KEY = 'site_consent_v1';

/**
 * @typedef {{ analytics: boolean, advertising: boolean, updatedAt: string }} ConsentChoice
 */

function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };
    }
}

/**
 * @param {Partial<ConsentChoice> | null} choice
 */
export function applyConsentMode(choice) {
    ensureGtag();

    const analytics = choice?.analytics === true ? 'granted' : 'denied';
    const advertising = choice?.advertising === true ? 'granted' : 'denied';

    window.gtag('consent', 'update', {
        ad_storage: advertising,
        ad_user_data: advertising,
        ad_personalization: advertising,
        analytics_storage: analytics,
    });
}

export function setConsentDefaults() {
    ensureGtag();

    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
    });
}

/**
 * @returns {ConsentChoice | null}
 */
export function readConsent() {
    try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (typeof parsed?.analytics !== 'boolean' || typeof parsed?.advertising !== 'boolean') {
            return null;
        }

        return {
            analytics: parsed.analytics,
            advertising: parsed.advertising,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

/**
 * @param {{ analytics: boolean, advertising: boolean }} choice
 * @returns {ConsentChoice}
 */
export function writeConsent(choice) {
    const stored = {
        analytics: choice.analytics === true,
        advertising: choice.advertising === true,
        updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    applyConsentMode(stored);
    window.dispatchEvent(new CustomEvent('site:consent-changed', { detail: stored }));

    return stored;
}

export function consentProvider() {
    return document.body?.dataset?.consentProvider || 'first_party';
}

export function adsenseClientId() {
    return document.body?.dataset?.adsenseClient || '';
}

export function adsenseSlot() {
    return document.body?.dataset?.adsenseSlot || '';
}

function loadAdSenseScript(clientId) {
    if (document.querySelector(`script[data-adsense-client="${clientId}"]`)) {
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsenseClient = clientId;
    document.head.appendChild(script);
}

function fillAdSlots(clientId, slot) {
    if (!slot) {
        return;
    }

    document.querySelectorAll('[data-ad-slot-host]').forEach((host) => {
        if (host.querySelector('ins.adsbygoogle')) {
            return;
        }

        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', clientId);
        ins.setAttribute('data-ad-slot', slot);
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
        host.appendChild(ins);
        host.removeAttribute('aria-hidden');

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // Ad blockers or a missing script should not break the tool.
        }
    });
}

/**
 * Load AdSense only when env IDs exist and consent allows (first-party)
 * or when Google Privacy & messaging owns consent.
 */
export function syncAdsWithConsent() {
    const clientId = adsenseClientId();
    if (!clientId) {
        return;
    }

    const provider = consentProvider();
    if (provider === 'google') {
        loadAdSenseScript(clientId);
        fillAdSlots(clientId, adsenseSlot());

        return;
    }

    const choice = readConsent();
    if (!choice?.advertising) {
        return;
    }

    loadAdSenseScript(clientId);
    fillAdSlots(clientId, adsenseSlot());
}

/** Run on every page before Alpine UI; works when the first-party banner is absent. */
export function bootConsent() {
    setConsentDefaults();

    const stored = readConsent();
    applyConsentMode(stored);
    syncAdsWithConsent();

    window.addEventListener('site:consent-changed', () => {
        syncAdsWithConsent();
    });
}

export function consentBannerFactory() {
    return {
        open: false,
        showDetails: false,
        analytics: false,
        advertising: false,

        init() {
            if (consentProvider() !== 'first_party') {
                return;
            }

            const stored = readConsent();

            if (stored) {
                this.analytics = stored.analytics;
                this.advertising = stored.advertising;
                this.open = false;
            } else {
                this.open = true;
            }

            window.addEventListener('site:consent-open', () => {
                const current = readConsent();
                this.analytics = current?.analytics === true;
                this.advertising = current?.advertising === true;
                this.showDetails = true;
                this.open = true;
            });
        },

        acceptAll() {
            writeConsent({ analytics: true, advertising: true });
            this.analytics = true;
            this.advertising = true;
            this.open = false;
            this.showDetails = false;
        },

        rejectNonEssential() {
            writeConsent({ analytics: false, advertising: false });
            this.analytics = false;
            this.advertising = false;
            this.open = false;
            this.showDetails = false;
        },

        saveChoices() {
            writeConsent({
                analytics: this.analytics === true,
                advertising: this.advertising === true,
            });
            this.open = false;
            this.showDetails = false;
        },
    };
}

export { CONSENT_STORAGE_KEY };
