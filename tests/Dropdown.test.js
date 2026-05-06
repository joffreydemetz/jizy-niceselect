/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import Dropdown from '../lib/js/Dropdown.js';

beforeEach(() => {
    document.body.innerHTML = '';
});

const items = () => [
    { text: 'Apple', value: 'a', uuid: 'u-a', selected: false, disabled: false, visible: true },
    { text: 'Banana', value: 'b', uuid: 'u-b', selected: true, disabled: false, visible: true },
    { text: 'Cherry', value: 'c', uuid: 'u-c', selected: false, disabled: true, visible: false },
];

describe('Dropdown.build / getElement', () => {
    test('lazy-builds a div + ul on first getElement', () => {
        const dd = new Dropdown({ items: items() });
        expect(dd.el).toBeNull();
        const el = dd.getElement();
        expect(el.tagName).toBe('DIV');
        expect(el.className).toBe('dropdown');
        expect(el.querySelector('ul')).not.toBeNull();
    });

    test('honours custom className', () => {
        const dd = new Dropdown({ items: items(), className: 'custom-list' });
        expect(dd.getElement().className).toBe('custom-list');
    });

    test('renders one <li> per item with data-value/data-uuid and a <span>', () => {
        const dd = new Dropdown({ items: items() });
        const lis = dd.getElement().querySelectorAll('li');
        expect(lis).toHaveLength(3);
        expect(lis[0].getAttribute('data-value')).toBe('a');
        expect(lis[0].getAttribute('data-uuid')).toBe('u-a');
        expect(lis[0].querySelector('span').textContent).toBe('Apple');
    });
});

describe('Dropdown.sync', () => {
    test('applies selected/disabled/hidden classes from item state', () => {
        const dd = new Dropdown({ items: items() });
        dd.getElement();
        dd.sync();

        const li = (v) => dd.getElement().querySelector(`li[data-value="${v}"]`);

        expect(li('a').classList.contains('selected')).toBe(false);
        expect(li('a').classList.contains('disabled')).toBe(false);
        expect(li('a').style.display).toBe('');

        expect(li('b').classList.contains('selected')).toBe(true);

        expect(li('c').classList.contains('disabled')).toBe(true);
        expect(li('c').style.display).toBe('none');
    });

    test('uses custom selected/disabled class names', () => {
        const dd = new Dropdown({
            items: items(),
            selectedClassName: 'is-on',
            disabledClassName: 'is-off',
        });
        dd.getElement();
        dd.sync();
        const li = (v) => dd.getElement().querySelector(`li[data-value="${v}"]`);
        expect(li('b').classList.contains('is-on')).toBe(true);
        expect(li('c').classList.contains('is-off')).toBe(true);
    });
});

describe('Dropdown.setItems / reset', () => {
    test('setItems replaces items but does not rebuild the list until reset()', () => {
        const dd = new Dropdown({ items: items() });
        dd.getElement();
        dd.setItems([{ text: 'Z', value: 'z', uuid: 'u-z', selected: false, disabled: false, visible: true }]);
        expect(dd.getElement().querySelectorAll('li')).toHaveLength(3);
        dd.reset();
        const lis = dd.getElement().querySelectorAll('li');
        expect(lis).toHaveLength(1);
        expect(lis[0].getAttribute('data-value')).toBe('z');
    });

    test('setItems is chainable', () => {
        const dd = new Dropdown();
        expect(dd.setItems([])).toBe(dd);
    });
});

describe('Dropdown click', () => {
    test('clicking an <li> invokes onItemSelected with that item', () => {
        const onItemSelected = jest.fn();
        const list = items();
        const dd = new Dropdown({ items: list, onItemSelected });
        dd.getElement();

        const li = dd.getElement().querySelector('li[data-value="a"]');
        li.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

        expect(onItemSelected).toHaveBeenCalledTimes(1);
        expect(onItemSelected).toHaveBeenCalledWith(list[0]);
    });
});

describe('Dropdown.destroy', () => {
    test('removes the element and nulls the reference', () => {
        const dd = new Dropdown({ items: items() });
        document.body.appendChild(dd.getElement());
        dd.destroy();
        expect(dd.el).toBeNull();
        expect(document.querySelector('.dropdown')).toBeNull();
    });
});
