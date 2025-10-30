/**
 * data format :
 *   [
 *     {
 *       text: 'Option 1',
 *       value: 'option1',
 *       selected: false,
 *       disabled: false
 *     },
 *     {
 *       text: 'Option 2',
 *       value: 'option2',
 *       selected: true,
 *       disabled: false
 *     }
 *   ]
 * 
 * fromData(data, multiple):
 *   set selection options from a simple array
 *   multiple: boolean to set if multiple selection is allowed
 *   hidden select Element will be added to the DOM
 *
 * fromSelect(el):
 *   set selection options from a select element 
 *   
 */
export default class Data {
    /**
     * Load items from a simple array of objects
     * It creates a hidden select element in the DOM
     * 
     * @param {Array} items
     * @returns {Data}
     */
    static fromData(items, multiple = false) {
        const instance = new Data(multiple);
        instance.setElement(document.createElement("select"));
        if (multiple) instance.el.setAttribute("multiple", multiple);

        items.forEach(item => {
            item = Data.parseItemData(item);

            const option = Data.createOptionElement(item);
            item.option = option;

            instance.el.appendChild(option);
            instance.data.push(item);
        });

        document.body.appendChild(instance.el);

        return instance;
    }

    /**
     * Load items from a select element
     * 
     * @param {HTMLSelectElement} el
     * @returns {Data}
     */
    static fromSelect(el) {
        const multiple = el.getAttribute("multiple") != null;
        const instance = new Data(multiple);

        instance.setElement(el);

        instance.el.querySelectorAll("option[value]").forEach(option => {
            // skip empty options (placeholders)
            if (option.value === '') return;
            if (option.value === '0') return;
            if (!option.value) return;

            const item = Data.parseItemData({
                text: option.innerText,
                value: option.value,
                selected: option.getAttribute("selected") != null,
                disabled: option.getAttribute("disabled") != null,
                option: option
            });

            instance.items.push(item);
        });

        return instance;
    }

    /**
     * Generates a simple random UID for an option element
     * 
     * @length 8 digits
     * @returns {string}
     */
    static generateUid() {
        return 'xxxxxxxx'.replace(/[x]/g, function (c) {
            const r = Math.random() * 16 | 0, v = r;
            return v.toString(16);
        });
    }

    /**
     * Create a DOM option Element
     * 
     * @param {Object} item A valid data item object
     * @returns {HTMLOptionElement}
     */
    static createOptionElement(item) {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.text;
        option.setAttribute("selected", item.selected ? "true" : null);
        option.setAttribute("disabled", item.disabled ? "true" : null);
        option.setAttribute('data-nice-uuid', item.uuid);
        return option;
    }

    /**
     * Parse item data and set default values
     * 
     * @param {Object} item
     * @returns {Object} a valid item data object
     */
    static parseItemData(item) {
        return Object.assign({
            text: '',
            value: '',
            selected: false,
            disabled: false,
            visible: true,
            uuid: Data.generateUid(),
            option: null
        }, item);
    }

    constructor(multiple = false) {
        // is multiple selection allowed
        this.multiple = multiple;

        // reference to the original select element
        this.el = null;

        // array of option data objects
        this.items = [];
    }

    setElement(el) {
        this.el = el;
        this.el.style.display = "none";
        return this;
    }

    getElement() {
        return this.el;
    }

    getItems() {
        return this.items;
    }

    getItem(value) {
        return this.items.find(item => item.value === value);
    }

    getSelection() {
        return this.items.filter(item => item.selected);
    }

    select(selectedItem) {
        console.dir(this.items);
        // if the clicked item is already selected -> clear all selections
        if (selectedItem.selected) {
            const item = this.items.find(item => item.value === selectedItem.value);
            item.selected = false;
            item.option.selected = false;
        } else if (this.multiple) {
            selectedItem.selected = true;
            selectedItem.option.selected = true;
        } else {
            this.items.forEach(item => {
                const isTarget = item.value === selectedItem.value;
                item.selected = isTarget;
                item.option.selected = isTarget;
            });
        }

        console.dir(this.items);
        return this;
    }

    reset() {
        this.items.forEach(item => {
            item.visible = true;
            item.selected = false;
            item.option.selected = false;
        });

        return this.items;
    }

    filter(term) {
        this.items.forEach(item => {
            item.visible = term ? item.text.toLowerCase().includes(term.toLowerCase()) : true;
        });

        return this.items;
    }
}
