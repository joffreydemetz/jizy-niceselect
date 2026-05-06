/**
 * @jest-environment jsdom
 */
import CurrentSelection from '../lib/js/CurrentSelection.js';

const item = (text) => ({ text, value: text, selected: true });

describe('CurrentSelection.build', () => {
    test('lazy-builds a span with the configured class', () => {
        const cs = new CurrentSelection({ className: 'mine' });
        expect(cs.el).toBeNull();
        const el = cs.getElement();
        expect(el.tagName).toBe('SPAN');
        expect(el.className).toBe('mine');
    });

    test('default className is "current"', () => {
        const cs = new CurrentSelection();
        expect(cs.getElement().className).toBe('current');
    });
});

describe('CurrentSelection.update — empty selection', () => {
    test('shows the no-selection message and the no-selection class', () => {
        const cs = new CurrentSelection({ noSelectionMessage: 'Pick one' });
        cs.getElement();
        cs.update([]);
        expect(cs.el.innerHTML).toBe('Pick one');
        expect(cs.el.classList.contains('no-selection')).toBe(true);
    });
});

describe('CurrentSelection.update — show selection (default)', () => {
    test('renders one inner <span> per selected item', () => {
        const cs = new CurrentSelection();
        cs.getElement();
        cs.update([item('A'), item('B')]);
        expect(cs.el.classList.contains('show-selection')).toBe(true);
        const spans = cs.el.querySelectorAll('span');
        expect(spans).toHaveLength(2);
        expect(spans[0].textContent).toBe('A');
        expect(spans[1].textContent).toBe('B');
    });

    test('show-selection branch is used in single mode even with showCount=true', () => {
        const cs = new CurrentSelection({
            multiple: false, showCount: true, minShowCount: 0,
            selectionCountMessage: '{count} selected',
        });
        cs.getElement();
        cs.update([item('A'), item('B')]);
        expect(cs.el.classList.contains('show-selection')).toBe(true);
    });
});

describe('CurrentSelection.update — count-selection branch', () => {
    test('renders the count message when multiple+showCount and length > minShowCount', () => {
        const cs = new CurrentSelection({
            multiple: true, showCount: true, minShowCount: 2,
            selectionCountMessage: '{count} items',
        });
        cs.getElement();
        cs.update([item('A'), item('B'), item('C')]);
        expect(cs.el.innerHTML).toBe('3 items');
        expect(cs.el.classList.contains('count-selection')).toBe(true);
    });

    test('falls back to show-selection when length is at the minShowCount threshold', () => {
        const cs = new CurrentSelection({
            multiple: true, showCount: true, minShowCount: 3,
            selectionCountMessage: '{count} items',
        });
        cs.getElement();
        cs.update([item('A'), item('B'), item('C')]);
        expect(cs.el.classList.contains('show-selection')).toBe(true);
        expect(cs.el.classList.contains('count-selection')).toBe(false);
    });
});

describe('CurrentSelection.update — class reset between calls', () => {
    test('previous branch class is removed when state changes', () => {
        const cs = new CurrentSelection();
        cs.getElement();
        cs.update([]);
        expect(cs.el.classList.contains('no-selection')).toBe(true);

        cs.update([item('A')]);
        expect(cs.el.classList.contains('no-selection')).toBe(false);
        expect(cs.el.classList.contains('show-selection')).toBe(true);
    });
});

describe('CurrentSelection.destroy', () => {
    test('removes the element and nulls the ref', () => {
        const cs = new CurrentSelection();
        document.body.appendChild(cs.getElement());
        cs.destroy();
        expect(cs.el).toBeNull();
        expect(document.querySelector('.current')).toBeNull();
    });
});
