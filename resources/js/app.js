import Alpine from 'alpinejs';

document.addEventListener('alpine:init', () => {
    Alpine.data('dropZone', () => ({
        error: '',

        open() {
            this.error = '';
        },

        onDrop(event) {
            event.preventDefault();
            this.open();
        },

        onPaste(event) {
            const items = event.clipboardData?.items;
            if (! items) {
                return;
            }

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    event.preventDefault();
                    this.open();
                    break;
                }
            }
        },
    }));
});

window.Alpine = Alpine;
Alpine.start();
