export default class Searchbox {
    constructor(config = {}) {
        this.placeholder = config.placeholder || 'Search...';
        this.minChars = config.minChars || 3;
        this.className = config.className || 'nice-searchbox';
        this.callback = config.callback || ((value) => { console.log('Search ' + value); });

        this.el = null;
        this.input = null;
    }

    destroy() {
        if (this.input) {
            this.input.remove();
            this.input = null;
        }
        if (this.el) {
            this.el.remove();
            this.el = null;
        }
    }

    getElement() {
        if (!this.el) {
            this.build();
        }
        return this.el;
    }

    build() {
        this.el = document.createElement('div');
        this.el.className = this.className;

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = this.placeholder;
        this.el.appendChild(this.input);

        this.input.addEventListener('input', (e) => {
            let value = null;
            if (e.target.value.length >= this.minChars) {
                value = e.target.value;
            }
            this.callback(value);
        });
    }

    reset() {
        if (this.input) {
            this.input.value = '';
        }
    }
}