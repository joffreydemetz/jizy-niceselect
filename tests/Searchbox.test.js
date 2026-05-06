/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import Searchbox from '../lib/js/Searchbox.js';

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('Searchbox.build', () => {
    test('produces a div with class + input child', () => {
        const sb = new Searchbox();
        const el = sb.getElement();
        expect(el.tagName).toBe('DIV');
        expect(el.className).toBe('nice-searchbox');
        const input = el.querySelector('input');
        expect(input).not.toBeNull();
        expect(input.type).toBe('text');
        expect(input.placeholder).toBe('Search...');
    });

    test('accepts custom placeholder and className', () => {
        const sb = new Searchbox({ placeholder: 'Find...', className: 'sbx' });
        const el = sb.getElement();
        expect(el.className).toBe('sbx');
        expect(el.querySelector('input').placeholder).toBe('Find...');
    });
});

describe('Searchbox input event', () => {
    test('callback receives the value once minChars is reached', () => {
        const callback = jest.fn();
        const sb = new Searchbox({ callback, minChars: 3 });
        const input = sb.getElement().querySelector('input');

        input.value = 'ab';
        input.dispatchEvent(new window.Event('input'));
        expect(callback).toHaveBeenLastCalledWith(null);

        input.value = 'abc';
        input.dispatchEvent(new window.Event('input'));
        expect(callback).toHaveBeenLastCalledWith('abc');

        input.value = 'abcd';
        input.dispatchEvent(new window.Event('input'));
        expect(callback).toHaveBeenLastCalledWith('abcd');

        expect(callback).toHaveBeenCalledTimes(3);
    });

    test('default minChars is 3', () => {
        const sb = new Searchbox();
        expect(sb.minChars).toBe(3);
    });
});

describe('Searchbox.reset / destroy', () => {
    test('reset clears the input value', () => {
        const sb = new Searchbox();
        const input = sb.getElement().querySelector('input');
        input.value = 'something';
        sb.reset();
        expect(input.value).toBe('');
    });

    test('reset is a no-op when not yet built', () => {
        const sb = new Searchbox();
        expect(() => sb.reset()).not.toThrow();
    });

    test('destroy removes element and nulls refs', () => {
        const sb = new Searchbox();
        document.body.appendChild(sb.getElement());
        sb.destroy();
        expect(sb.el).toBeNull();
        expect(sb.input).toBeNull();
        expect(document.querySelector('.nice-searchbox')).toBeNull();
    });
});
