import Alpine from 'alpinejs';
import { toolIsland } from './tool-island.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('toolIsland', (config) => toolIsland(config));
});

window.Alpine = Alpine;
Alpine.start();
