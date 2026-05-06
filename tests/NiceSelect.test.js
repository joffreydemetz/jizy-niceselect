/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import NiceSelect from '../lib/js/NiceSelect.js';

// jsdom's innerText returns undefined for elements that aren't laid out;
// the lib reads option.innerText / placeholder.innerText. Alias to textContent.
Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
    get() { return this.textContent; },
    set(v) { this.textContent = v; },
    configurable: true,
});

beforeEach(() => {
    document.body.innerHTML = '';
});

const buildSelect = (html, attrs = {}) => {
    const el = document.createElement('select');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
};

const defaultOptions = `
    <option value="">-- choose --</option>
    <option value="a">Apple</option>
    <option value="b">Banana</option>
    <option value="c">Cherry</option>
`;

describe('NiceSelect.extendConfig', () => {
    test('overrides scalar values', () => {
        const merged = NiceSelect.extendConfig(
            { a: 1, b: 2 },
            { b: 9 }
        );
        expect(merged).toEqual({ a: 1, b: 9 });
    });

    test('deep-merges nested objects', () => {
        const merged = NiceSelect.extendConfig(
            { dropdown: { className: 'd', selectedClassName: 's' } },
            { dropdown: { selectedClassName: 'sel' } }
        );
        expect(merged).toEqual({
            dropdown: { className: 'd', selectedClassName: 'sel' },
        });
    });

    test('does not mutate the defaults argument', () => {
        const defaults = { dropdown: { className: 'd' } };
        NiceSelect.extendConfig(defaults, { dropdown: { className: 'x' } });
        expect(defaults.dropdown.className).toBe('d');
    });
});

describe('NiceSelect render', () => {
    test('inserts the .nice-select element before the original <select> and hides it', () => {
        const el = buildSelect(defaultOptions);
        new NiceSelect(el);

        const nice = document.querySelector('.nice-select');
        expect(nice).not.toBeNull();
        expect(nice.nextSibling).toBe(el);
        expect(el.style.display).toBe('none');
    });

    test('renders trigger + dropdown with one <li> per non-placeholder option', () => {
        const el = buildSelect(defaultOptions);
        new NiceSelect(el);

        const nice = document.querySelector('.nice-select');
        expect(nice.querySelector('.trigger')).not.toBeNull();
        expect(nice.querySelector('.trigger .arrow')).not.toBeNull();

        const dropdown = nice.querySelector('.dropdown');
        expect(dropdown).not.toBeNull();
        expect(dropdown.querySelectorAll('li')).toHaveLength(3);
    });

    test('uses data-placeholder when present', () => {
        const el = buildSelect(defaultOptions, { 'data-placeholder': 'Pick a fruit' });
        new NiceSelect(el);
        expect(document.querySelector('.nice-select .trigger > span').textContent).toBe('Pick a fruit');
    });

    test('disabled select renders the disabled class', () => {
        const el = buildSelect(defaultOptions, { disabled: 'disabled' });
        const ns = new NiceSelect(el);
        const nice = document.querySelector('.nice-select');
        expect(nice.classList.contains('disabled')).toBe(true);
        // The lib stores TabIndex=null for disabled instances; HTMLElement.tabIndex
        // coerces null to 0 per the IDL, so we assert on the internal field.
        expect(ns.TabIndex).toBeNull();
    });

    test('multiple select renders the multiple class', () => {
        const el = buildSelect(defaultOptions, { multiple: 'multiple' });
        new NiceSelect(el);
        expect(document.querySelector('.nice-select').classList.contains('multiple')).toBe(true);
    });

    test('data-searchable adds a searchbox', () => {
        const el = buildSelect(defaultOptions, { 'data-searchable': '' });
        new NiceSelect(el);
        const sbx = document.querySelector('.nice-select .searchbox');
        expect(sbx).not.toBeNull();
        expect(sbx.querySelector('input')).not.toBeNull();
    });

    test('data-current with a non-empty value adds a current-selection element', () => {
        // getAttribute('data-current') returns '' for an empty attribute, which
        // is falsy — so the lib only enables showSelection on a truthy value.
        const el = buildSelect(defaultOptions, { 'data-current': '1' });
        new NiceSelect(el);
        expect(document.querySelector('.nice-select .current')).not.toBeNull();
    });

    test('honours tabindex from the source select', () => {
        const el = buildSelect(defaultOptions, { tabindex: '5' });
        new NiceSelect(el);
        expect(document.querySelector('.nice-select').tabIndex).toBe(5);
    });
});

describe('NiceSelect open / close', () => {
    test('clicking the trigger toggles the .open class', () => {
        const el = buildSelect(defaultOptions);
        new NiceSelect(el);
        const nice = document.querySelector('.nice-select');
        const trigger = nice.querySelector('.trigger');

        trigger.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        expect(nice.classList.contains('open')).toBe(true);

        trigger.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        expect(nice.classList.contains('open')).toBe(false);
    });

    test('clicking outside closes an open nice-select', () => {
        const el = buildSelect(defaultOptions);
        const ns = new NiceSelect(el);
        ns.open();
        expect(ns.niceElement.classList.contains('open')).toBe(true);

        document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        expect(ns.niceElement.classList.contains('open')).toBe(false);
    });

    test('open() is a no-op on a disabled instance', () => {
        const el = buildSelect(defaultOptions, { disabled: 'disabled' });
        const ns = new NiceSelect(el);
        ns.open();
        expect(ns.niceElement.classList.contains('open')).toBe(false);
    });
});

describe('NiceSelect enable / disable', () => {
    test('disable() sets the disabled attribute and clears tabindex', () => {
        const el = buildSelect(defaultOptions);
        const ns = new NiceSelect(el);
        ns.disable();
        expect(ns.disabled).toBe(true);
        expect(ns.niceElement.getAttribute('disabled')).toBe('true');
    });

    test('enable() clears the disabled attribute', () => {
        const el = buildSelect(defaultOptions, { disabled: 'disabled' });
        const ns = new NiceSelect(el);
        ns.enable();
        expect(ns.disabled).toBe(false);
        expect(ns.niceElement.hasAttribute('disabled')).toBe(false);
    });
});

describe('NiceSelect.selectItem (single mode)', () => {
    test('clicking an option selects it in the data and the original <select>', () => {
        const el = buildSelect(defaultOptions);
        const ns = new NiceSelect(el);

        const li = ns.niceElement.querySelector('li[data-value="b"]');
        li.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

        const selection = ns.data.getSelection();
        expect(selection).toHaveLength(1);
        expect(selection[0].value).toBe('b');
        expect(el.value).toBe('b');
        expect(li.classList.contains('selected')).toBe(true);
    });

    test('switching selection clears the previous selected item', () => {
        const el = buildSelect(defaultOptions);
        const ns = new NiceSelect(el);

        const a = ns.niceElement.querySelector('li[data-value="a"]');
        const b = ns.niceElement.querySelector('li[data-value="b"]');
        a.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        b.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

        expect(a.classList.contains('selected')).toBe(false);
        expect(b.classList.contains('selected')).toBe(true);
    });
});

describe('NiceSelect.selectItem (multiple mode)', () => {
    test('multiple selections accumulate and update the current-selection block', () => {
        const el = buildSelect(defaultOptions, { multiple: 'multiple', 'data-current': '1' });
        const ns = new NiceSelect(el);

        ns.niceElement.querySelector('li[data-value="a"]')
            .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        ns.niceElement.querySelector('li[data-value="c"]')
            .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

        expect(ns.data.getSelection().map(i => i.value).sort()).toEqual(['a', 'c']);
        const current = ns.niceElement.querySelector('.current');
        expect(current.classList.contains('show-selection')).toBe(true);
        expect(current.querySelectorAll('span')).toHaveLength(2);
    });
});

describe('NiceSelect.reset', () => {
    test('clears selection, restores visibility and resets the searchbox', () => {
        const el = buildSelect(defaultOptions, { 'data-searchable': '' });
        const ns = new NiceSelect(el);

        ns.niceElement.querySelector('li[data-value="a"]')
            .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        const input = ns.niceElement.querySelector('.searchbox input');
        input.value = 'apple';

        ns.reset();

        expect(ns.data.getSelection()).toHaveLength(0);
        expect(input.value).toBe('');
        ns.data.getItems().forEach(item => expect(item.visible).toBe(true));
    });
});

describe('NiceSelect searchable wiring', () => {
    test('typing >= minChars filters the dropdown', () => {
        const el = buildSelect(defaultOptions, { 'data-searchable': '' });
        const ns = new NiceSelect(el);
        const input = ns.niceElement.querySelector('.searchbox input');

        input.value = 'app';
        input.dispatchEvent(new window.Event('input'));

        const visible = ns.data.getItems().filter(i => i.visible);
        expect(visible).toHaveLength(1);
        expect(visible[0].value).toBe('a');

        const liA = ns.niceElement.querySelector('li[data-value="a"]');
        const liB = ns.niceElement.querySelector('li[data-value="b"]');
        expect(liA.style.display).toBe('');
        expect(liB.style.display).toBe('none');
    });

    test('typing below minChars resets visibility', () => {
        const el = buildSelect(defaultOptions, { 'data-searchable': '' });
        const ns = new NiceSelect(el);
        const input = ns.niceElement.querySelector('.searchbox input');

        input.value = 'app';
        input.dispatchEvent(new window.Event('input'));
        input.value = 'a';
        input.dispatchEvent(new window.Event('input'));

        ns.data.getItems().forEach(i => expect(i.visible).toBe(true));
    });
});

describe('NiceSelect.destroy', () => {
    test('removes the rendered structure and restores the original select', () => {
        const el = buildSelect(defaultOptions);
        const ns = new NiceSelect(el);
        expect(document.querySelector('.nice-select')).not.toBeNull();

        ns.destroy();

        expect(document.querySelector('.nice-select')).toBeNull();
        expect(ns.niceElement).toBeNull();
        expect(ns.dropdown).toBeNull();
        expect(ns.trigger).toBeNull();
        expect(el.style.display).toBe('');
    });

    test('also tears down searchbox and currentSelection wrappers when present', () => {
        const el = buildSelect(defaultOptions, {
            'data-searchable': '',
            'data-current': '1',
        });
        const ns = new NiceSelect(el);
        expect(ns.searchbox).not.toBeNull();
        expect(ns.currentSelection).not.toBeNull();

        ns.destroy();

        expect(ns.searchbox).toBeNull();
        expect(ns.currentSelection).toBeNull();
        expect(document.querySelector('.searchbox')).toBeNull();
        expect(document.querySelector('.current')).toBeNull();
    });
});

describe('NiceSelect.fromData', () => {
    test('returns a NiceSelect bound to a generated <select> and renders the UI', () => {
        const ns = NiceSelect.fromData([
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b' },
        ]);

        expect(ns).toBeInstanceOf(NiceSelect);
        expect(ns.selectElement.tagName).toBe('SELECT');

        const nice = document.querySelector('.nice-select');
        expect(nice).not.toBeNull();
        expect(nice.querySelectorAll('li')).toHaveLength(2);
    });

    test('multiple flag passes through to the rendered structure', () => {
        const ns = NiceSelect.fromData([{ text: 'A', value: 'a' }], true);
        expect(ns.niceElement.classList.contains('multiple')).toBe(true);
    });
});
