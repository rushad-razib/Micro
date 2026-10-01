import Alpine from 'alpinejs';
import { bootConsent, consentBannerFactory } from './consent.js';
import { documentIsland } from './document-island.js';
import { toolIsland } from './tool-island.js';

bootConsent();

document.addEventListener('alpine:init', () => {
    Alpine.data('toolIsland', (config) => toolIsland(config));
    Alpine.data('documentIsland', (config) => documentIsland(config));
    Alpine.data('consentBanner', () => consentBannerFactory());
});

window.Alpine = Alpine;
Alpine.start();
