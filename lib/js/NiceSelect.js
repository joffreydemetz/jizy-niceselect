import Data from './Data.js';
import Dropdown from './Dropdown.js';
import Searchbox from './Searchbox.js';
import CurrentSelection from './CurrentSelection.js';

/**
 * Select: 
 * <select[ multiple][ disabled][ data-searchable][ data-placeholder="Choose ..."]>
 *  <option value="">[placeholder]</option>
 *  <option value="[value]"[ selected][ disabled]>[text]</option>
 * </select>
 * 
 * Structure:
 * <div class="nice-select[ disabled][ multiple]" tabindex="[0|null]">
 *   <div class="trigger">
 *     <span>[placeholder]</span>
 *     <span class="arrow"></span>
 *   </div>
 *   <div class="current">
 *     <span>Choose ...</span>
 *   </div>
 *   <div class="searchbox">
 *     <input type="text" placeholder="[searchPlaceholder]" />
 *   </div>
 *   <div class="dropdown">
 *     <ul class="list">
 *       <li class="option" data-value="[value]">[text]</li>
 *     </ul>
 *   </div>
 * </div>
 */

export default class NiceSelect {
    static fromData(items = [], multiple = false, config = {}) {
        const data = Data.fromData(items, multiple);
        const instance = new NiceSelect(data.getElement(), config);
        return instance;
    }

    static extendConfig(defaults, config) {
        const merged = JSON.parse(JSON.stringify(defaults));
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                if (typeof config[key] === "object" && config[key] !== null) {
                    merged[key] = NiceSelect.extendConfig(merged[key], config[key]);
                } else {
                    merged[key] = config[key];
                }
            }
        }
        return merged;
    }

    constructor(element, config = {}) {
        this.selectElement = element;
        this.selectElement.style.display = "none";

        this.config = NiceSelect.extendConfig({
            disabled: false,
            multiple: false,
            searchable: false,
            showSelection: false,
            placeholder: 'Choose',
            searchPlaceholder: 'Search',
            dropdown: {
                className: 'dropdown',
                selectedClassName: 'selected',
                disabledClassName: 'disabled'
            },
            search: {
                className: 'searchbox',
                minChars: 3
            },
            selection: {
                className: 'current',
                noSelectionMessage: 'Choose below ...',
                selectionCountMessage: '{count} items selected',
                showCount: false,
                minShowCount: 3
            }
        }, config || {});

        this.disabled = this.config.disabled;
        this.multiple = this.config.multiple;
        this.searchable = this.config.searchable;
        this.placeholder = this.config.placeholder;

        const placeholder = this.determinePlaceholder();

        if (placeholder) {
            this.placeholder = placeholder;
        }

        if (this.selectElement.getAttribute("disabled") !== null) {
            this.disabled = true;
        }

        if (this.selectElement.getAttribute("multiple") !== null) {
            this.multiple = true;
        }

        if (this.selectElement.getAttribute('data-searchable') !== null) {
            this.searchable = true;
        }

        if (this.selectElement.getAttribute("data-current")) {
            this.config.showSelection = true;
        }

        this.TabIndex = 0;
        if (this.selectElement.getAttribute('tabindex')) {
            this.TabIndex = this.selectElement.getAttribute('tabindex');
        }
        if (this.disabled) {
            this.TabIndex = null;
        }

        this.niceElement = null;
        this.trigger = null;
        this.dropdown = null;
        this.currentSelection = null;
        this.searchbox = null;

        this.data = Data.fromSelect(this.selectElement);

        this.render();
    }

    destroy() {
        if (this.currentSelection) {
            this.currentSelection.remove();
            this.currentSelection = null;
        }

        if (this.searchbox) {
            this.searchbox.remove();
            this.searchbox = null;
        }

        if (this.dropdown) {
            this.dropdown.remove();
            this.dropdown = null;
        }

        if (this.trigger) {
            this.trigger.remove();
            this.trigger = null;
        }

        if (this.niceElement) {
            this.niceElement.remove();
            this.niceElement = null;
        }

        this.selectElement.style.display = "";
    }

    determinePlaceholder() {
        if (this.selectElement.getAttribute("data-placeholder")) {
            return this.selectElement.getAttribute("data-placeholder");
        }

        const placeholder = ["option[value='']", "option[value='0']", "option:not([value])"].find(selector => {
            const option = this.selectElement.querySelector(selector);
            return option && option.innerText;
        });

        return placeholder ? this.selectElement.querySelector(placeholder).innerText : null;
    }

    render() {
        // container
        //   trigger
        //   current selection
        //   searchbox
        //   dropdown
        //     list

        const classes = [];
        classes.push("nice-select");
        if (this.disabled) classes.push("disabled");
        if (this.multiple) classes.push("multiple");

        this.niceElement = document.createElement("div");
        this.niceElement.className = classes.join(" ");
        this.niceElement.tabIndex = this.TabIndex;

        this.trigger = document.createElement("div");
        this.trigger.className = "trigger";
        this.trigger.innerHTML = '<span>' + this.placeholder + '</span><span class="arrow"></span>';
        this.niceElement.append(this.trigger);

        if (this.config.showSelection) {
            this.currentSelection = new CurrentSelection({
                multiple: this.multiple,
                className: this.config.selection.className || 'current',
                noSelectionMessage: this.config.selection.noSelectionMessage || 'No selection',
                showCount: this.config.selection.showCount || false,
                selectionCountMessage: this.config.selection.selectionCountMessage || '{count} items selected',
                minShowCount: this.config.selection.minShowCount || 3
            });
            this.niceElement.append(this.currentSelection.getElement());
        }

        if (this.searchable) {
            this.searchbox = new Searchbox({
                placeholder: this.config.search.placeholder || 'Search...',
                className: this.config.search.className || 'searchbox',
                minChars: this.config.search.minChars || 3,
                callback: (term) => {
                    const items = this.data.filter(term);
                    this.dropdown.sync(items);
                }
            });
            this.niceElement.append(this.searchbox.getElement());
        }

        this.dropdown = new Dropdown({
            className: this.config.dropdown.className || 'dropdown',
            selectedClassName: this.config.dropdown.selectedClassName || 'selected',
            disabledClassName: this.config.dropdown.disabledClassName || 'disabled',
            items: this.data.getItems(),
            onItemSelected: (item) => this.selectItem(item)
        });
        this.niceElement.appendChild(this.dropdown.getElement());

        // @TODO check predetermined search term

        // insert before original select element
        this.selectElement.parentNode.insertBefore(this.niceElement, this.selectElement);

        // event listeners

        this.sync();

        this.trigger.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.niceElement.classList.contains("open")) {
                this.close();
                return;
            }
            this.open();
        });

        document.addEventListener("click", (e) => {
            if (this.searchable && this.searchbox.getElement().contains(e.target)) {
                this.searchbox.getElement().focus();
            } else if (!this.niceElement.contains(e.target)) {
                this.close();
            }
        });
    }

    sync() {
        const items = this.data.getItems();
        const selection = this.data.getSelection();

        if (this.currentSelection) {
            this.currentSelection.update(selection);
        }

        this.dropdown.setItems(items);
        this.dropdown.sync();
    }

    selectItem(item) {
        console.dir(item);
        this.data.select(item);
        this.sync();
    }

    reset() {
        this.data.reset();

        if (this.searchbox) {
            this.searchbox.reset();
        }

        this.sync();
    }

    disable() {
        if (!this.disabled) {
            this.disabled = true;
            this.niceElement.tabIndex = null;
            this.niceElement.setAttribute("disabled", "true");
        }
    }

    enable() {
        if (this.disabled) {
            this.disabled = false;
            this.niceElement.removeAttribute("disabled");
        }
    }

    open() {
        if (this.disabled) {
            return;
        }

        if (this.niceElement.classList.contains("open")) {
            return;
        }

        this.niceElement.classList.add("open");

        if (this.searchbox) {
            // focus the search input
            this.niceElement.querySelector(".searchbox > input").focus();
        }

        // this.bindOpenedEvents();
    }

    close() {
        if (!this.niceElement.classList.contains("open")) {
            return;
        }
        this.niceElement.classList.remove("open");
        this.niceElement.blur();
        // this.unbindOpenedEvents();
    }

    bindOpenedEvents() {
        // TAB / ARROWS / ...

        // check for tab
        //   if focused on trigger move to first option [or search]
        //   if focused on search move to first option
        //   if focused on option move to next option
        //   if focused on last option do nothing
        // check for shift+tab
        //   if focused on option move to previous option
        //   if focused on first option move to search [or trigger]
        //   if focused on search move to trigger
        //   if focused on trigger do nothing
        /* this.niceElement.onkeydown = (e) => {
            const key = e.key;
            const focusedElement = document.activeElement;
    
            if (key === "Tab") {
                e.preventDefault();
    
                if (e.shiftKey) {
                    return;
                }
    
                return;
    
            }
        };*/
    }

    unbindOpenedEvents() {
    }
}