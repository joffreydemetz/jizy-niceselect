export default class CurrentSelection {
    constructor(config = {}) {
        this.multiple = config.multiple || false;
        this.className = config.className || 'current';
        this.noSelectionMessage = config.noSelectionMessage || 'Choose below ...';
        this.showCount = config.showCount || false;
        this.selectionCountMessage = config.selectionCountMessage || '{count} items selected';
        this.minShowCount = config.minShowCount || 3;

        this.el = null;
    }

    destroy() {
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
        this.el = document.createElement("span");
        this.el.className = this.className;
    }

    update(selection = []) {
        this.el.className = this.className; // reset classes

        if (selection.length === 0) {
            this.el.innerHTML = this.noSelectionMessage;
            this.el.classList.add('no-selection');
        } else if (this.multiple && this.showCount && selection.length > this.minShowCount) {
            this.el.innerHTML = this.selectionCountMessage.replace('{count}', selection.length);
            this.el.classList.add('count-selection');
        } else {
            this.el.innerHTML = selection.map(item => '<span>' + item.text + '</span>').join('');
            this.el.classList.add('show-selection');
        }
    }

    reset() {
        this.update();
    }
}
