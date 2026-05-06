/**
 * @jest-environment jsdom
 */
import Data from '../lib/js/Data.js';

// jsdom's innerText returns undefined for elements that aren't laid out;
// the lib reads option.innerText. Alias it to textContent for tests.
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

describe('Data.parseItemData', () => {
    test('applies defaults for missing fields', () => {
        const item = Data.parseItemData({ text: 'Apple', value: 'a' });
        expect(item.text).toBe('Apple');
        expect(item.value).toBe('a');
        expect(item.selected).toBe(false);
        expect(item.disabled).toBe(false);
        expect(item.visible).toBe(true);
        expect(item.option).toBeNull();
        expect(typeof item.uuid).toBe('string');
        expect(item.uuid).toHaveLength(8);
    });

    test('preserves caller-provided fields', () => {
        const item = Data.parseItemData({
            text: 'X', value: 'x',
            selected: true, disabled: true, visible: false,
        });
        expect(item.selected).toBe(true);
        expect(item.disabled).toBe(true);
        expect(item.visible).toBe(false);
    });
});

describe('Data.generateUid', () => {
    test('returns an 8-char hex string', () => {
        const uid = Data.generateUid();
        expect(uid).toMatch(/^[0-9a-f]{8}$/);
    });

    test('produces unique values across calls', () => {
        const uids = new Set(Array.from({ length: 50 }, () => Data.generateUid()));
        expect(uids.size).toBeGreaterThan(1);
    });
});

describe('Data.createOptionElement', () => {
    test('builds an <option> with value, text and uuid', () => {
        const item = Data.parseItemData({ text: 'Foo', value: 'foo' });
        const opt = Data.createOptionElement(item);
        expect(opt.tagName).toBe('OPTION');
        expect(opt.value).toBe('foo');
        expect(opt.textContent).toBe('Foo');
        expect(opt.getAttribute('data-nice-uuid')).toBe(item.uuid);
    });

    test('selected/disabled flags propagate as attributes', () => {
        const item = Data.parseItemData({
            text: 'Bar', value: 'b', selected: true, disabled: true,
        });
        const opt = Data.createOptionElement(item);
        expect(opt.getAttribute('selected')).toBe('true');
        expect(opt.getAttribute('disabled')).toBe('true');
    });
});

describe('Data.fromSelect', () => {
    test('reads non-empty options from a select element', () => {
        const el = buildSelect(`
            <option value="">-- choose --</option>
            <option value="a">Apple</option>
            <option value="b" selected>Banana</option>
            <option value="c" disabled>Cherry</option>
        `);

        const data = Data.fromSelect(el);
        expect(data.multiple).toBe(false);
        expect(data.getElement()).toBe(el);
        expect(data.getItems()).toHaveLength(3);

        const apple = data.getItem('a');
        expect(apple.text).toBe('Apple');
        expect(apple.selected).toBe(false);

        const banana = data.getItem('b');
        expect(banana.selected).toBe(true);

        const cherry = data.getItem('c');
        expect(cherry.disabled).toBe(true);
    });

    test('skips placeholder options (empty value or value="0")', () => {
        const el = buildSelect(`
            <option value="">empty</option>
            <option value="0">zero</option>
            <option value="x">X</option>
        `);
        const data = Data.fromSelect(el);
        expect(data.getItems()).toHaveLength(1);
        expect(data.getItems()[0].value).toBe('x');
    });

    test('detects multiple attribute', () => {
        const el = buildSelect('<option value="a">A</option>', { multiple: 'multiple' });
        const data = Data.fromSelect(el);
        expect(data.multiple).toBe(true);
    });

    test('hides the original select via setElement', () => {
        const el = buildSelect('<option value="a">A</option>');
        Data.fromSelect(el);
        expect(el.style.display).toBe('none');
    });
});

describe('Data instance — selection in single mode', () => {
    let el, data;
    beforeEach(() => {
        el = buildSelect(`
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
        `);
        data = Data.fromSelect(el);
    });

    test('select() picks one item and clears the others', () => {
        data.select(data.getItem('b'));
        const selection = data.getSelection();
        expect(selection).toHaveLength(1);
        expect(selection[0].value).toBe('b');
        expect(data.getItem('b').option.selected).toBe(true);
        expect(data.getItem('a').option.selected).toBe(false);
    });

    test('selecting an already-selected item clears it', () => {
        const b = data.getItem('b');
        data.select(b);
        data.select(b);
        expect(data.getSelection()).toHaveLength(0);
        expect(b.option.selected).toBe(false);
    });

    test('reset() clears selection and restores visibility', () => {
        data.select(data.getItem('a'));
        data.filter('zzz');
        data.reset();
        // Note: the DOM auto-selects the first option in a single <select> when no
        // option is selected, so we only assert on the library's `selected` flag.
        expect(data.getSelection()).toHaveLength(0);
        data.getItems().forEach(item => {
            expect(item.visible).toBe(true);
            expect(item.selected).toBe(false);
        });
    });
});

describe('Data instance — selection in multiple mode', () => {
    let el, data;
    beforeEach(() => {
        el = buildSelect(`
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
        `, { multiple: 'multiple' });
        data = Data.fromSelect(el);
    });

    test('select() accumulates selections', () => {
        data.select(data.getItem('a'));
        data.select(data.getItem('c'));
        expect(data.getSelection().map(i => i.value).sort()).toEqual(['a', 'c']);
        expect(data.getItem('a').option.selected).toBe(true);
        expect(data.getItem('c').option.selected).toBe(true);
        expect(data.getItem('b').option.selected).toBe(false);
    });

    test('selecting an already-selected item removes it from selection', () => {
        const a = data.getItem('a');
        data.select(a);
        data.select(a);
        expect(data.getSelection()).toHaveLength(0);
    });
});

describe('Data.filter', () => {
    test('matches items case-insensitively against text', () => {
        const el = buildSelect(`
            <option value="a">Apple</option>
            <option value="b">Banana</option>
            <option value="c">Avocado</option>
        `);
        const data = Data.fromSelect(el);
        data.filter('a');
        expect(data.getItem('a').visible).toBe(true);
        expect(data.getItem('b').visible).toBe(true);
        expect(data.getItem('c').visible).toBe(true);

        data.filter('av');
        expect(data.getItem('a').visible).toBe(false);
        expect(data.getItem('b').visible).toBe(false);
        expect(data.getItem('c').visible).toBe(true);
    });

    test('empty term restores visibility for all', () => {
        const el = buildSelect(`
            <option value="a">Apple</option>
            <option value="b">Banana</option>
        `);
        const data = Data.fromSelect(el);
        data.filter('apple');
        expect(data.getItem('b').visible).toBe(false);

        data.filter('');
        expect(data.getItem('a').visible).toBe(true);
        expect(data.getItem('b').visible).toBe(true);
    });
});

describe('Data.fromData', () => {
    test('builds a hidden <select>, appends it to the body, and populates items', () => {
        const data = Data.fromData([
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b', selected: true },
        ]);

        const el = data.getElement();
        expect(el.tagName).toBe('SELECT');
        expect(el.style.display).toBe('none');
        expect(el.parentNode).toBe(document.body);
        expect(el.querySelectorAll('option')).toHaveLength(2);

        expect(data.getItems()).toHaveLength(2);
        expect(data.getItem('a').option.tagName).toBe('OPTION');
        expect(data.getItem('b').selected).toBe(true);
    });

    test('sets the multiple attribute when multiple=true', () => {
        const data = Data.fromData([{ text: 'A', value: 'a' }], true);
        expect(data.multiple).toBe(true);
        expect(data.getElement().hasAttribute('multiple')).toBe(true);
    });
});
