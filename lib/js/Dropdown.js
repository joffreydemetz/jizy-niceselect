export default class Dropdown {
    constructor(config = {}) {
        this.className = config.className || 'dropdown';
        this.selectedClassName = config.selectedClassName || 'selected';
        this.disabledClassName = config.disabledClassName || 'disabled';
        this.onItemSelected = config.onItemSelected || ((item) => { console.log('Item selected', item); });
        this.setItems(config.items || []);

        this.el = null;
    }

    setItems(items = []) {
        this.items = items;
        return this;
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
        this.el = document.createElement('div');
        this.el.className = this.className;

        this.list = document.createElement('ul');
        this.el.appendChild(this.list);

        this.buildList();
    }

    reset() {
        this.buildList();
        return this;
    }

    buildList() {
        this.list.innerHTML = '';

        this.items.forEach(item => {
            const li = this.createItemElement(item);
            this.list.appendChild(li);
        });
    }

    createItemElement(item) {
        const li = document.createElement('li');
        li.setAttribute('data-value', item.value);
        li.setAttribute('data-uuid', item.uuid);
        li.innerHTML = '<span>' + item.text + '</span>';

        li.addEventListener('click', (e) => {
            this.onItemSelected(item);

            this.items.forEach(item => {
                this.updateItemElement(item);
            });
        });

        return li;
    }

    sync() {
        this.items.forEach(item => {
            this.updateItemElement(item);
        });
    }

    updateItemElement(item) {
        const li = this.list.querySelector(`li[data-value="${item.value}"]`);
        if (item.disabled) {
            li.classList.add(this.disabledClassName);
        }
        else {
            li.classList.remove(this.disabledClassName);
        }

        if (item.selected) {
            li.classList.add(this.selectedClassName);
        }
        else {
            li.classList.remove(this.selectedClassName);
        }

        if (item.visible === false) {
            li.style.display = 'none';
        } else {
            li.style.display = '';
        }
    }
}
